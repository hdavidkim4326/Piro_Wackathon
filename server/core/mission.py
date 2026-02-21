from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import MissionTemplate


def get_default_mission(db: Session) -> MissionTemplate | None:
    """현재 시스템에서 사용할 기본 미션을 조회한다."""
    return db.execute(
        select(MissionTemplate).order_by(MissionTemplate.mission_id).limit(1)
    ).scalar_one_or_none()


def ensure_default_mission(db: Session) -> MissionTemplate:
    """기본 미션이 없으면 생성하고 반환한다."""
    mission = get_default_mission(db)
    if mission:
        return mission

    mission = MissionTemplate()
    db.add(mission)
    db.flush()
    return mission
