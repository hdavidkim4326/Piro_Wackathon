from __future__ import annotations

import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from threading import Lock

SESSION_TTL_MINUTES = 10


@dataclass
class GameSession:
    session_id: str
    grid_id: str
    boss_grid_id: str | None
    game_type: str
    mode: str
    user_key: str
    status: str
    score: int
    game_level: int
    created_at: datetime
    expires_at: datetime

    def to_dict(self) -> dict:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["expires_at"] = self.expires_at.isoformat()
        return data


@dataclass
class BossState:
    grid_id: str
    max_hp: int
    current_hp: int
    damage_per_hit: int
    click_limit_per_user: int
    updated_at: datetime

    def to_dict(self) -> dict:
        return {
            "grid_id": self.grid_id,
            "max_hp": self.max_hp,
            "current_hp": self.current_hp,
            "damage_per_hit": self.damage_per_hit,
            "click_limit_per_user": self.click_limit_per_user,
            "updated_at": self.updated_at.isoformat(),
        }


_sessions: dict[str, GameSession] = {}
_boss_states: dict[str, BossState] = {}
_user_clicks: dict[tuple[str, str], int] = {}
_boss_last_hitter: dict[str, str] = {}
_boss_claimed: set[str] = set()
_runtime_lock = Lock()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _purge_expired_sessions() -> None:
    now = _now()
    expired_ids = [sid for sid, session in _sessions.items() if session.expires_at <= now]
    for sid in expired_ids:
        session = _sessions.pop(sid, None)
        if not session:
            continue
        boss_key = session.boss_grid_id or session.grid_id
        _user_clicks.pop((boss_key, session.user_key), None)


def create_session(grid_id: str, game_config: dict, user_key: str) -> GameSession:
    with _runtime_lock:
        _purge_expired_sessions()

        now = _now()
        session = GameSession(
            session_id=str(uuid.uuid4()),
            grid_id=grid_id,
            boss_grid_id=game_config.get("boss_grid_id"),
            game_type=game_config["game_type"],
            mode=game_config["mode"],
            user_key=user_key,
            status="READY",
            score=0,
            game_level=int(game_config["level"]),
            created_at=now,
            expires_at=now + timedelta(minutes=SESSION_TTL_MINUTES),
        )
        _sessions[session.session_id] = session
        return session


def get_session(session_id: str) -> GameSession | None:
    with _runtime_lock:
        _purge_expired_sessions()
        return _sessions.get(session_id)


def submit_basic_result(
    session_id: str,
    success: bool,
    score: int,
    game_level: int,
) -> GameSession | None:
    with _runtime_lock:
        _purge_expired_sessions()
        session = _sessions.get(session_id)
        if not session:
            return None

        session.score = max(0, int(score))
        session.game_level = max(1, int(game_level))
        session.status = "SUCCESS" if success else "FAILED"
        return session


def ensure_boss_state(grid_id: str, rules: dict) -> BossState:
    with _runtime_lock:
        if grid_id in _boss_states:
            return _boss_states[grid_id]

        state = BossState(
            grid_id=grid_id,
            max_hp=int(rules["boss_hp"]),
            current_hp=int(rules["boss_hp"]),
            damage_per_hit=int(rules.get("damage_per_hit", 1)),
            click_limit_per_user=int(rules.get("click_limit_per_user", 20)),
            updated_at=_now(),
        )
        _boss_states[grid_id] = state
        return state


def apply_boss_hit(session_id: str, user_key: str) -> dict | None:
    with _runtime_lock:
        _purge_expired_sessions()
        session = _sessions.get(session_id)
        if not session:
            return None
        if session.game_type != "boss_click":
            return {
                "ok": False,
                "reason": "not_boss_game",
            }

        boss_key = session.boss_grid_id or session.grid_id
        boss = _boss_states.get(boss_key)
        if not boss:
            return {
                "ok": False,
                "reason": "boss_state_missing",
            }

        click_key = (boss_key, user_key)
        used_clicks = _user_clicks.get(click_key, 0)
        if used_clicks >= boss.click_limit_per_user:
            session.status = "FAILED"
            return {
                "ok": False,
                "reason": "click_limit_reached",
                "boss_state": boss.to_dict(),
                "used_clicks": used_clicks,
                "remaining_clicks": 0,
            }

        if boss.current_hp <= 0:
            session.status = "SUCCESS"
            return {
                "ok": True,
                "reason": "boss_already_defeated",
                "boss_state": boss.to_dict(),
                "used_clicks": used_clicks,
                "remaining_clicks": boss.click_limit_per_user - used_clicks,
                "session_status": session.status,
            }

        _user_clicks[click_key] = used_clicks + 1
        boss.current_hp = max(0, boss.current_hp - boss.damage_per_hit)
        boss.updated_at = _now()
        session.score += boss.damage_per_hit
        _boss_last_hitter[boss_key] = user_key

        if boss.current_hp == 0:
            session.status = "SUCCESS"
        else:
            session.status = "IN_PROGRESS"

        used_clicks = _user_clicks[click_key]
        return {
            "ok": True,
            "reason": "hit_applied",
            "boss_state": boss.to_dict(),
            "used_clicks": used_clicks,
            "remaining_clicks": max(0, boss.click_limit_per_user - used_clicks),
            "session_status": session.status,
        }


def mark_claimed(session_id: str) -> GameSession | None:
    with _runtime_lock:
        _purge_expired_sessions()
        session = _sessions.get(session_id)
        if not session:
            return None
        if session.status == "SUCCESS":
            session.status = "CLAIMED"
        return session


def reserve_boss_claim(boss_grid_id: str) -> dict:
    """
    Reserve a defeated boss for one-time DB claim application.
    """
    with _runtime_lock:
        boss = _boss_states.get(boss_grid_id)
        if not boss:
            return {"ok": False, "reason": "boss_state_missing"}
        if boss.current_hp > 0:
            return {"ok": False, "reason": "boss_not_defeated"}
        if boss_grid_id in _boss_claimed:
            return {
                "ok": True,
                "already_claimed": True,
                "last_hitter_user_key": _boss_last_hitter.get(boss_grid_id),
            }

        _boss_claimed.add(boss_grid_id)
        return {
            "ok": True,
            "already_claimed": False,
            "last_hitter_user_key": _boss_last_hitter.get(boss_grid_id),
        }


def release_boss_claim_reservation(boss_grid_id: str) -> None:
    with _runtime_lock:
        _boss_claimed.discard(boss_grid_id)
