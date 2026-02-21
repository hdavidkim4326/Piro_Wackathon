from __future__ import annotations

from threading import Lock

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from core.game_rules import get_game_config_for_tile
from core.game_runtime import (
    apply_boss_hit,
    create_session,
    ensure_boss_state,
    get_session,
    mark_claimed,
    submit_basic_result,
)
from core.special_tiles import parse_grid_id

router = APIRouter()


class BossRealtimeHub:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = {}
        self._lock = Lock()

    async def connect(self, boss_grid_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        with self._lock:
            self._rooms.setdefault(boss_grid_id, set()).add(websocket)

    def disconnect(self, boss_grid_id: str, websocket: WebSocket) -> None:
        with self._lock:
            room = self._rooms.get(boss_grid_id)
            if not room:
                return
            room.discard(websocket)
            if not room:
                self._rooms.pop(boss_grid_id, None)

    async def broadcast(self, boss_grid_id: str, payload: dict) -> None:
        with self._lock:
            targets = list(self._rooms.get(boss_grid_id, set()))

        stale: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                stale.append(ws)

        if not stale:
            return

        with self._lock:
            room = self._rooms.get(boss_grid_id)
            if not room:
                return
            for ws in stale:
                room.discard(ws)
            if not room:
                self._rooms.pop(boss_grid_id, None)


boss_realtime_hub = BossRealtimeHub()


class GameConfigResponse(BaseModel):
    grid_id: str
    mode: str
    pattern: str | None
    game_type: str
    title: str
    level: int
    rules: dict
    boss_grid_id: str | None = None
    is_special_center: bool | None = None


class StartGameRequest(BaseModel):
    user_key: str | None = None


class StartGameResponse(BaseModel):
    session_id: str
    config: GameConfigResponse
    session_status: str
    expires_at: str
    boss_state: dict | None = None


class GameActionRequest(BaseModel):
    session_id: str
    action_type: str = Field(description="submit_result | boss_hit")
    success: bool | None = None
    score: int | None = None
    game_level: int | None = None
    user_key: str | None = None


class GameActionResponse(BaseModel):
    success: bool
    message: str
    session_status: str
    can_claim: bool
    score: int
    boss_state: dict | None = None
    remaining_clicks: int | None = None


class ClaimGameRequest(BaseModel):
    session_id: str


class ClaimGameResponse(BaseModel):
    success: bool
    can_claim: bool
    session_status: str
    message: str


def _validate_grid_id(grid_id: str) -> None:
    if not parse_grid_id(grid_id):
        raise HTTPException(status_code=400, detail="Invalid grid_id format.")


@router.get("/games/{grid_id}", response_model=GameConfigResponse)
def get_tile_game(grid_id: str):
    _validate_grid_id(grid_id)
    return GameConfigResponse(**get_game_config_for_tile(grid_id))


@router.post("/games/{grid_id}/start", response_model=StartGameResponse)
def start_tile_game(grid_id: str, body: StartGameRequest):
    _validate_grid_id(grid_id)
    config = get_game_config_for_tile(grid_id)
    user_key = (body.user_key or "anonymous").strip() or "anonymous"

    session = create_session(grid_id=grid_id, game_config=config, user_key=user_key)

    boss_state = None
    if config["game_type"] == "boss_click":
        boss_grid_id = config.get("boss_grid_id") or grid_id
        boss_state = ensure_boss_state(boss_grid_id, config["rules"]).to_dict()

    return StartGameResponse(
        session_id=session.session_id,
        config=GameConfigResponse(**config),
        session_status=session.status,
        expires_at=session.expires_at.isoformat(),
        boss_state=boss_state,
    )


@router.post("/games/{grid_id}/action", response_model=GameActionResponse)
async def game_action(grid_id: str, body: GameActionRequest):
    _validate_grid_id(grid_id)

    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found or expired.")
    if session.grid_id != grid_id:
        raise HTTPException(status_code=400, detail="Session and grid mismatch.")

    if session.game_type == "boss_click":
        if body.action_type != "boss_hit":
            raise HTTPException(status_code=400, detail="Boss game supports only boss_hit action.")

        user_key = (body.user_key or session.user_key or "anonymous").strip() or "anonymous"
        result = apply_boss_hit(session.session_id, user_key=user_key)
        if not result:
            raise HTTPException(status_code=404, detail="Game session not found or expired.")

        if not result["ok"]:
            return GameActionResponse(
                success=False,
                message=result["reason"],
                session_status=session.status,
                can_claim=False,
                score=session.score,
                boss_state=result.get("boss_state"),
                remaining_clicks=result.get("remaining_clicks"),
            )

        can_claim = session.status == "SUCCESS"
        boss_grid_id = session.boss_grid_id or session.grid_id
        if result.get("boss_state"):
            await boss_realtime_hub.broadcast(
                boss_grid_id,
                {
                    "type": "boss_state",
                    "grid_id": grid_id,
                    "boss_grid_id": boss_grid_id,
                    "session_status": session.status,
                    "updated_by": user_key,
                    "boss_state": result.get("boss_state"),
                },
            )
        return GameActionResponse(
            success=True,
            message=result["reason"],
            session_status=session.status,
            can_claim=can_claim,
            score=session.score,
            boss_state=result.get("boss_state"),
            remaining_clicks=result.get("remaining_clicks"),
        )

    if body.action_type != "submit_result":
        raise HTTPException(status_code=400, detail="Basic game supports only submit_result action.")
    if body.success is None:
        raise HTTPException(status_code=400, detail="success is required for submit_result.")

    updated = submit_basic_result(
        session_id=session.session_id,
        success=bool(body.success),
        score=int(body.score or 0),
        game_level=int(body.game_level or session.game_level),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Game session not found or expired.")

    can_claim = updated.status == "SUCCESS"
    return GameActionResponse(
        success=bool(body.success),
        message="result_submitted",
        session_status=updated.status,
        can_claim=can_claim,
        score=updated.score,
    )


@router.post("/games/{grid_id}/claim", response_model=ClaimGameResponse)
def claim_tile_game(grid_id: str, body: ClaimGameRequest):
    _validate_grid_id(grid_id)

    session = get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found or expired.")
    if session.grid_id != grid_id:
        raise HTTPException(status_code=400, detail="Session and grid mismatch.")

    can_claim = session.status == "SUCCESS"
    if not can_claim:
        return ClaimGameResponse(
            success=False,
            can_claim=False,
            session_status=session.status,
            message="Game is not in SUCCESS state.",
        )

    claimed = mark_claimed(body.session_id)
    if not claimed:
        raise HTTPException(status_code=404, detail="Game session not found or expired.")

    return ClaimGameResponse(
        success=True,
        can_claim=True,
        session_status=claimed.status,
        message="Claim approved.",
    )


@router.websocket("/games/{grid_id}/ws")
async def boss_game_ws(grid_id: str, websocket: WebSocket):
    if not parse_grid_id(grid_id):
        await websocket.close(code=1008, reason="Invalid grid_id format.")
        return

    config = get_game_config_for_tile(grid_id)
    if config.get("game_type") != "boss_click":
        await websocket.close(code=1008, reason="Realtime updates are boss-game only.")
        return

    boss_grid_id = config.get("boss_grid_id") or grid_id
    await boss_realtime_hub.connect(boss_grid_id, websocket)

    try:
        boss_state = ensure_boss_state(boss_grid_id, config["rules"]).to_dict()
        await websocket.send_json(
            {
                "type": "boss_state",
                "grid_id": grid_id,
                "boss_grid_id": boss_grid_id,
                "session_status": "SYNC",
                "updated_by": None,
                "boss_state": boss_state,
            }
        )

        while True:
            try:
                incoming = await websocket.receive_json()
            except ValueError:
                continue

            msg_type = incoming.get("type")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "sync":
                synced = ensure_boss_state(boss_grid_id, config["rules"]).to_dict()
                await websocket.send_json(
                    {
                        "type": "boss_state",
                        "grid_id": grid_id,
                        "boss_grid_id": boss_grid_id,
                        "session_status": "SYNC",
                        "updated_by": None,
                        "boss_state": synced,
                    }
                )
                continue

            if msg_type == "boss_hit":
                session_id = str(incoming.get("session_id") or "").strip()
                if not session_id:
                    await websocket.send_json(
                        {
                            "type": "boss_hit_ack",
                            "success": False,
                            "message": "session_id_required",
                            "can_claim": False,
                        }
                    )
                    continue

                session = get_session(session_id)
                if not session:
                    await websocket.send_json(
                        {
                            "type": "boss_hit_ack",
                            "success": False,
                            "message": "session_not_found",
                            "can_claim": False,
                        }
                    )
                    continue

                if session.grid_id != grid_id:
                    await websocket.send_json(
                        {
                            "type": "boss_hit_ack",
                            "success": False,
                            "message": "session_grid_mismatch",
                            "can_claim": False,
                        }
                    )
                    continue

                if session.game_type != "boss_click":
                    await websocket.send_json(
                        {
                            "type": "boss_hit_ack",
                            "success": False,
                            "message": "not_boss_game",
                            "can_claim": False,
                        }
                    )
                    continue

                user_key = (
                    str(incoming.get("user_key") or session.user_key or "anonymous").strip()
                    or "anonymous"
                )

                result = apply_boss_hit(session.session_id, user_key=user_key)
                if not result:
                    await websocket.send_json(
                        {
                            "type": "boss_hit_ack",
                            "success": False,
                            "message": "session_not_found",
                            "can_claim": False,
                        }
                    )
                    continue

                boss_state = result.get("boss_state")
                if result["ok"] and boss_state:
                    await boss_realtime_hub.broadcast(
                        boss_grid_id,
                        {
                            "type": "boss_state",
                            "grid_id": grid_id,
                            "boss_grid_id": boss_grid_id,
                            "session_status": session.status,
                            "updated_by": user_key,
                            "boss_state": boss_state,
                        },
                    )

                await websocket.send_json(
                    {
                        "type": "boss_hit_ack",
                        "success": bool(result["ok"]),
                        "message": result.get("reason", "unknown"),
                        "session_status": session.status,
                        "can_claim": session.status == "SUCCESS",
                        "score": session.score,
                        "remaining_clicks": result.get("remaining_clicks"),
                        "boss_state": boss_state,
                    }
                )
    except WebSocketDisconnect:
        pass
    finally:
        boss_realtime_hub.disconnect(boss_grid_id, websocket)
