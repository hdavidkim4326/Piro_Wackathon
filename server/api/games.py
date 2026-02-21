from __future__ import annotations

from fastapi import APIRouter, HTTPException
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
def game_action(grid_id: str, body: GameActionRequest):
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
