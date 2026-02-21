"""
타일(그리드) API 라우터 — 동기 버전
──────────────────────────────────
DB 팀원의 SQLAlchemy 2.0 모델(Territory, TerritoryStatus, Organization)을
사용해 프론트엔드의 grid_id / owner_univ / level 규격으로 번역한다.

[번역 매핑]
  Territory.w3w           →  grid_id
  Organization.org_name   →  owner_univ
  occupation history 최신  →  level

[엔드포인트]
  GET  /api/tiles   뷰포트 내 타일 조회
  POST /api/occupy  타일 점령 (Upsert 체인)
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from core.grid import get_viewport_grid_ids, grid_polygon
from database import get_db
from models import (
    OccupationCategory,
    Organization,
    Territory,
    TerritoryOccupationHistory,
    TerritoryStatus,
    TerritoryStatusEnum,
)
from schemas import TileRead, TileOccupyRequest

router = APIRouter()

# ─── 기본 카테고리 이름 (Organization, Territory FK에 필요) ───
DEFAULT_CATEGORY_NAME = "대학교"


def _ensure_category(db: Session) -> OccupationCategory:
    """기본 카테고리가 없으면 생성하고 반환한다."""
    cat = db.execute(
        select(OccupationCategory)
        .where(OccupationCategory.name == DEFAULT_CATEGORY_NAME)
    ).scalar_one_or_none()

    if not cat:
        cat = OccupationCategory(name=DEFAULT_CATEGORY_NAME)
        db.add(cat)
        db.flush()

    return cat


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GET /api/tiles
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/tiles", response_model=list[TileRead])
def get_tiles(
    min_lat: float = Query(..., description="뷰포트 남쪽 경계 위도"),
    max_lat: float = Query(..., description="뷰포트 북쪽 경계 위도"),
    min_lng: float = Query(..., description="뷰포트 서쪽 경계 경도"),
    max_lng: float = Query(..., description="뷰포트 동쪽 경계 경도"),
    db: Session = Depends(get_db),
):
    """
    뷰포트 내 모든 타일 정보를 반환한다.

    1. 뷰포트 좌표로 grid_id 목록을 계산
    2. Territory(w3w) + TerritoryStatus + Organization JOIN → 점령 정보
    3. TerritoryOccupationHistory COUNT → 레벨
    4. DB에 없는 grid_id는 빈 타일(level=0)로 채워서 반환
    """
    grid_ids = get_viewport_grid_ids(min_lat, max_lat, min_lng, max_lng)[:500]
    if not grid_ids:
        return []

    # Territory + 현재 점령 상태 + 소속 대학 + 점령 횟수(=레벨)를 한 번에 조회
    stmt = (
        select(
            Territory.w3w,
            Organization.org_name,
            func.count(TerritoryOccupationHistory.occupation_id).label("level"),
        )
        .join(
            TerritoryStatus,
            Territory.territory_id == TerritoryStatus.territory_id,
        )
        .join(
            Organization,
            TerritoryStatus.org_id == Organization.org_id,
        )
        .outerjoin(
            TerritoryOccupationHistory,
            Territory.territory_id == TerritoryOccupationHistory.territory_id,
        )
        .where(
            Territory.w3w.in_(grid_ids),
            TerritoryStatus.status == TerritoryStatusEnum.OCCUPIED,
        )
        .group_by(Territory.w3w, Organization.org_name)
    )

    rows = db.execute(stmt).all()

    # w3w → (org_name, level) 매핑
    tile_map: dict[str, tuple[str, int]] = {
        row.w3w: (row.org_name, max(row.level, 1))
        for row in rows
    }

    response: list[TileRead] = []
    for gid in grid_ids:
        polygon = grid_polygon(gid)
        if gid in tile_map:
            owner, level = tile_map[gid]
            response.append(
                TileRead(grid_id=gid, owner_univ=owner, level=level, polygon=polygon)
            )
        else:
            response.append(
                TileRead(grid_id=gid, owner_univ=None, level=0, polygon=polygon)
            )

    return response


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /api/occupy
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/occupy", response_model=TileRead)
def occupy_tile(
    body: TileOccupyRequest,
    db: Session = Depends(get_db),
):
    """
    타일을 점령한다 (Upsert 체인).

    FK 제약조건에 걸리지 않도록 연관 객체를 순서대로 확인/생성한다:
      1. OccupationCategory (기본 "대학교")
      2. Organization (university → org_name)
      3. Territory (grid_id → w3w)
      4. TerritoryStatus (NEUTRAL → OCCUPIED 전환)
      5. TerritoryOccupationHistory (점령 기록 INSERT)
    """
    now = datetime.now(timezone.utc)

    # ── 1. 기본 카테고리 ─────────────────────────────────────
    category = _ensure_category(db)

    # ── 2. Organization upsert ───────────────────────────────
    org = db.execute(
        select(Organization).where(
            Organization.org_name == body.university,
            Organization.category_id == category.category_id,
        )
    ).scalar_one_or_none()

    if not org:
        org = Organization(
            org_name=body.university,
            category_id=category.category_id,
        )
        db.add(org)
        db.flush()

    # ── 3. Territory upsert ─────────────────────────────────
    territory = db.execute(
        select(Territory).where(
            Territory.w3w == body.grid_id,
            Territory.category_id == category.category_id,
        )
    ).scalar_one_or_none()

    if not territory:
        territory = Territory(
            w3w=body.grid_id,
            category_id=category.category_id,
        )
        db.add(territory)
        db.flush()

    # ── 4. TerritoryStatus upsert ────────────────────────────
    status = db.execute(
        select(TerritoryStatus).where(
            TerritoryStatus.territory_id == territory.territory_id,
        )
    ).scalar_one_or_none()

    if status:
        status.org_id = org.org_id
        status.status = TerritoryStatusEnum.OCCUPIED
        status.protected_until = now
    else:
        status = TerritoryStatus(
            territory_id=territory.territory_id,
            org_id=org.org_id,
            status=TerritoryStatusEnum.OCCUPIED,
            protected_until=now,
        )
        db.add(status)

    # ── 5. 점령 히스토리 기록 ────────────────────────────────
    history = TerritoryOccupationHistory(
        territory_id=territory.territory_id,
        category_id=category.category_id,
        org_id=org.org_id,
        user_id=None,
        protected_until=now,
        level=body.level,
    )
    db.add(history)

    db.commit()

    polygon = grid_polygon(body.grid_id)
    return TileRead(
        grid_id=body.grid_id,
        owner_univ=body.university,
        level=body.level,
        polygon=polygon,
    )
