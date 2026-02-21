from __future__ import annotations

import uuid
from threading import Lock
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from core.game_rules import get_game_config_for_tile
from core.game_runtime import (
    apply_boss_hit,
    create_session,
    ensure_boss_state,
    get_session,
    mark_claimed,
    release_boss_claim_reservation,
    reserve_boss_claim,
    submit_basic_result,
)
from core.mission import ensure_default_mission
from core.special_tiles import (
    get_special_capture_grid_ids,
    get_special_zone_info,
)
from core.special_tiles import parse_grid_id
from database import get_db
from models import (
    OccupationCategory,
    Organization,
    Territory,
    TerritoryOccupationHistory,
    TerritoryStatus,
    TerritoryStatusEnum,
    UserOrganization,
)

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
    capture_applied: bool = False
    capture_tile_count: int = 0
    boss_grid_id: str | None = None
    special_type: str | None = None
    contribution_user_id: str | None = None


def _validate_grid_id(grid_id: str) -> None:
    if not parse_grid_id(grid_id):
        raise HTTPException(status_code=400, detail="Invalid grid_id format.")


DEFAULT_CATEGORY_NAME = "대학교"


def _parse_user_id(raw_user_id: str | None) -> uuid.UUID:
    if not raw_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header is required.")
    try:
        return uuid.UUID(raw_user_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id.") from exc


def _ensure_category(db: Session) -> OccupationCategory:
    category = db.execute(
        select(OccupationCategory).where(OccupationCategory.name == DEFAULT_CATEGORY_NAME)
    ).scalar_one_or_none()
    if category:
        return category

    category = OccupationCategory(name=DEFAULT_CATEGORY_NAME)
    db.add(category)
    db.flush()
    return category


def _resolve_user_org(db: Session, user_id: uuid.UUID) -> tuple[uuid.UUID, str]:
    row = db.execute(
        select(Organization.org_id, Organization.org_name)
        .join(UserOrganization, UserOrganization.org_id == Organization.org_id)
        .where(UserOrganization.user_id == user_id)
    ).first()
    if not row or not row.org_name:
        raise HTTPException(status_code=403, detail="User organization not found.")
    return row.org_id, row.org_name


def _upsert_territories(
    db: Session,
    grid_ids: list[str],
    category_id: uuid.UUID,
    mission_id: uuid.UUID,
) -> dict[str, Territory]:
    existing = db.execute(
        select(Territory).where(
            Territory.w3w.in_(grid_ids),
            Territory.category_id == category_id,
            Territory.mission_id == mission_id,
        )
    ).scalars().all()

    territory_by_grid = {str(territory.w3w): territory for territory in existing if territory.w3w}
    missing_grid_ids = [grid_id for grid_id in grid_ids if grid_id not in territory_by_grid]

    for grid_id in missing_grid_ids:
        territory = Territory(
            w3w=grid_id,
            category_id=category_id,
            mission_id=mission_id,
        )
        db.add(territory)
        territory_by_grid[grid_id] = territory

    db.flush()
    return territory_by_grid


def _apply_special_capture(
    db: Session,
    *,
    center_grid_id: str,
    special_type: str,
    organization_id: uuid.UUID,
    contribution_user_id: uuid.UUID | None,
    game_level: int,
) -> int:
    target_grid_ids = get_special_capture_grid_ids(center_grid_id, special_type)
    if not target_grid_ids:
        raise HTTPException(status_code=400, detail="Invalid special center.")

    category = _ensure_category(db)
    mission = ensure_default_mission(db)
    now = datetime.now(timezone.utc)

    territory_by_grid = _upsert_territories(
        db,
        grid_ids=target_grid_ids,
        category_id=category.category_id,
        mission_id=mission.mission_id,
    )

    territory_ids = [territory.territory_id for territory in territory_by_grid.values()]
    existing_statuses = db.execute(
        select(TerritoryStatus).where(
            TerritoryStatus.territory_id.in_(territory_ids),
            TerritoryStatus.mission_id == mission.mission_id,
        )
    ).scalars().all()
    status_by_tid = {status.territory_id: status for status in existing_statuses}

    for grid_id in target_grid_ids:
        territory = territory_by_grid[grid_id]
        status = status_by_tid.get(territory.territory_id)
        if status:
            status.org_id = organization_id
            status.status = TerritoryStatusEnum.OCCUPIED
            status.protected_until = now
        else:
            db.add(
                TerritoryStatus(
                    territory_id=territory.territory_id,
                    mission_id=mission.mission_id,
                    org_id=organization_id,
                    status=TerritoryStatusEnum.OCCUPIED,
                    protected_until=now,
                )
            )

        db.add(
            TerritoryOccupationHistory(
                territory_id=territory.territory_id,
                category_id=category.category_id,
                org_id=organization_id,
                user_id=contribution_user_id,
                protected_until=now,
                level=max(1, game_level),
            )
        )

    return len(target_grid_ids)


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
def claim_tile_game(
    grid_id: str,
    body: ClaimGameRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
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

    if session.game_type != "boss_click":
        claimed = mark_claimed(body.session_id)
        return ClaimGameResponse(
            success=True,
            can_claim=True,
            session_status=claimed.status if claimed else "CLAIMED",
            message="Claim approved.",
        )

    user_id = _parse_user_id(x_user_id)
    organization_id, _ = _resolve_user_org(db, user_id)
    boss_grid_id = session.boss_grid_id or session.grid_id

    reserve = reserve_boss_claim(boss_grid_id)
    if not reserve.get("ok"):
        return ClaimGameResponse(
            success=False,
            can_claim=False,
            session_status=session.status,
            message=reserve.get("reason", "claim_not_available"),
            boss_grid_id=boss_grid_id,
        )

    if reserve.get("already_claimed"):
        claimed = mark_claimed(body.session_id)
        return ClaimGameResponse(
            success=True,
            can_claim=True,
            session_status=claimed.status if claimed else "CLAIMED",
            message="Special zone was already captured for this boss.",
            capture_applied=False,
            capture_tile_count=0,
            boss_grid_id=boss_grid_id,
        )

    zone_info = get_special_zone_info(boss_grid_id)
    special_type = zone_info.get("special_zone_type") or "3x3"

    contribution_user_id: uuid.UUID | None = user_id
    last_hitter_user_key = reserve.get("last_hitter_user_key")
    if isinstance(last_hitter_user_key, str):
        try:
            last_hitter_user_id = uuid.UUID(last_hitter_user_key)
            same_org = db.execute(
                select(UserOrganization.user_id).where(
                    UserOrganization.user_id == last_hitter_user_id,
                    UserOrganization.org_id == organization_id,
                )
            ).scalar_one_or_none()
            if same_org:
                contribution_user_id = last_hitter_user_id
        except ValueError:
            pass

    try:
        capture_tile_count = _apply_special_capture(
            db,
            center_grid_id=boss_grid_id,
            special_type=special_type,
            organization_id=organization_id,
            contribution_user_id=contribution_user_id,
            game_level=session.game_level,
        )
        db.commit()
    except HTTPException:
        db.rollback()
        release_boss_claim_reservation(boss_grid_id)
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        release_boss_claim_reservation(boss_grid_id)
        raise HTTPException(
            status_code=500,
            detail="Failed to apply special capture transaction.",
        ) from exc

    claimed = mark_claimed(body.session_id)

    return ClaimGameResponse(
        success=True,
        can_claim=True,
        session_status=claimed.status if claimed else "CLAIMED",
        message="Special zone capture applied.",
        capture_applied=True,
        capture_tile_count=capture_tile_count,
        boss_grid_id=boss_grid_id,
        special_type=special_type,
        contribution_user_id=str(contribution_user_id) if contribution_user_id else None,
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
