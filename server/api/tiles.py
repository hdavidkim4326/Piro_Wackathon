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

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import and_, select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from core.grid import get_viewport_grid_ids, grid_polygon
from core.mission import ensure_default_mission, get_default_mission
from core.special_tiles import classify_special_tile, get_special_zone_info
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
from schemas import SpecialCenterRead, TileRead, TileOccupyRequest

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


def _parse_user_id(raw_user_id: str | None) -> uuid.UUID | None:
    if not raw_user_id:
        return None
    try:
        return uuid.UUID(raw_user_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 X-User-Id 입니다.") from exc


def _resolve_university_for_request(
    db: Session,
    user_id: uuid.UUID | None,
    requested_university: str,
) -> str:
    """
    user_id가 있으면 DB 소속 대학명을 진실값으로 사용하고,
    없으면 요청 body의 university를 사용한다.
    """
    if not user_id:
        name = requested_university.strip()
        if not name:
            raise HTTPException(status_code=400, detail="university 값이 비어 있습니다.")
        return name

    university = db.execute(
        select(Organization.org_name)
        .join(UserOrganization, Organization.org_id == UserOrganization.org_id)
        .where(UserOrganization.user_id == user_id)
    ).scalar_one_or_none()

    if not university:
        raise HTTPException(status_code=403, detail="사용자 소속 대학 정보를 찾을 수 없습니다.")

    return university


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
    mission = get_default_mission(db)

    # Territory + 현재 점령 상태 + 소속 대학 + 점령 횟수(=레벨)를 한 번에 조회
    stmt = (
        select(
            Territory.w3w,
            Organization.org_name,
            func.count(TerritoryOccupationHistory.occupation_id).label("level"),
        )
        .join(
            TerritoryStatus,
            and_(
                Territory.territory_id == TerritoryStatus.territory_id,
                Territory.mission_id == TerritoryStatus.mission_id,
            ),
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
    if mission:
        stmt = stmt.where(
            Territory.mission_id == mission.mission_id,
            TerritoryStatus.mission_id == mission.mission_id,
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
        special = classify_special_tile(gid)
        zone = get_special_zone_info(gid)
        is_special = bool(special["is_special"])
        special_type = special["special_type"]
        in_special_zone = bool(zone["in_special_zone"])
        special_zone_type = zone["special_zone_type"]
        special_center_grid_id = zone["special_center_grid_id"]

        if gid in tile_map:
            owner, level = tile_map[gid]
            response.append(
                TileRead(
                    grid_id=gid,
                    owner_univ=owner,
                    level=level,
                    is_special=is_special,
                    special_type=special_type,
                    in_special_zone=in_special_zone,
                    special_zone_type=special_zone_type,
                    special_center_grid_id=special_center_grid_id,
                    polygon=polygon,
                )
            )
        else:
            response.append(
                TileRead(
                    grid_id=gid,
                    owner_univ=None,
                    level=0,
                    is_special=is_special,
                    special_type=special_type,
                    in_special_zone=in_special_zone,
                    special_zone_type=special_zone_type,
                    special_center_grid_id=special_center_grid_id,
                    polygon=polygon,
                )
            )

    return response


@router.get("/special-centers", response_model=list[SpecialCenterRead])
def get_special_centers(
    min_lat: float = Query(..., description="酉고룷???⑥そ 寃쎄퀎 ?꾨룄"),
    max_lat: float = Query(..., description="酉고룷??遺곸そ 寃쎄퀎 ?꾨룄"),
    min_lng: float = Query(..., description="酉고룷???쒖そ 寃쎄퀎 寃쎈룄"),
    max_lng: float = Query(..., description="酉고룷???숈そ 寃쎄퀎 寃쎈룄"),
):
    centers = get_special_centers_in_bounds(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
    )
    return [SpecialCenterRead(**center) for center in centers]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /api/occupy
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/occupy", response_model=TileRead)
def occupy_tile(
    body: TileOccupyRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    """
    타일을 점령한다 (Upsert 체인).

    FK 제약조건에 걸리지 않도록 연관 객체를 순서대로 확인/생성한다:
      1. OccupationCategory (기본 "대학교")
      2. MissionTemplate (기본 미션)
      3. Organization (university → org_name)
      4. Territory (grid_id → w3w)
      5. TerritoryStatus (NEUTRAL → OCCUPIED 전환)
      6. TerritoryOccupationHistory (점령 기록 INSERT)

    전체 단계는 단일 DB 트랜잭션으로 처리한다.
    """
    user_id = _parse_user_id(x_user_id)
    now = datetime.now(timezone.utc)
    effective_university = body.university.strip()

    try:
        with db.begin():
            # ── 1. 기본 카테고리 ─────────────────────────────────
            category = _ensure_category(db)

            # ── 2. 기본 미션 확보 ─────────────────────────────────
            mission = ensure_default_mission(db)

            # ── 3. 사용자 소속 대학 결정 ─────────────────────────
            effective_university = _resolve_university_for_request(
                db=db,
                user_id=user_id,
                requested_university=body.university,
            )

            # ── 4. Organization upsert ───────────────────────────
            org = db.execute(
                select(Organization).where(
                    Organization.org_name == effective_university,
                    Organization.category_id == category.category_id,
                )
            ).scalar_one_or_none()

            if not org:
                org = Organization(
                    org_name=effective_university,
                    category_id=category.category_id,
                )
                db.add(org)
                db.flush()

            # ── 5. Territory upsert ─────────────────────────────
            territory = db.execute(
                select(Territory).where(
                    Territory.w3w == body.grid_id,
                    Territory.category_id == category.category_id,
                    Territory.mission_id == mission.mission_id,
                )
            ).scalar_one_or_none()

            if not territory:
                territory = Territory(
                    w3w=body.grid_id,
                    category_id=category.category_id,
                    mission_id=mission.mission_id,
                )
                db.add(territory)
                db.flush()

            # ── 6. TerritoryStatus upsert ───────────────────────
            status = db.execute(
                select(TerritoryStatus).where(
                    TerritoryStatus.territory_id == territory.territory_id,
                    TerritoryStatus.mission_id == mission.mission_id,
                )
            ).scalar_one_or_none()

            if status:
                status.org_id = org.org_id
                status.status = TerritoryStatusEnum.OCCUPIED
                status.protected_until = now
            else:
                status = TerritoryStatus(
                    territory_id=territory.territory_id,
                    mission_id=mission.mission_id,
                    org_id=org.org_id,
                    status=TerritoryStatusEnum.OCCUPIED,
                    protected_until=now,
                )
                db.add(status)

            # ── 7. 점령 히스토리 기록 ──────────────────────────
            history = TerritoryOccupationHistory(
                territory_id=territory.territory_id,
                category_id=category.category_id,
                org_id=org.org_id,
                user_id=user_id,
                protected_until=now,
                level=body.level,
            )
            db.add(history)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="점령 처리 중 DB 오류가 발생했습니다.") from exc

    polygon = grid_polygon(body.grid_id)
    special = classify_special_tile(body.grid_id)
    zone = get_special_zone_info(body.grid_id)
    return TileRead(
        grid_id=body.grid_id,
        owner_univ=effective_university,
        level=body.level,
        is_special=bool(special["is_special"]),
        special_type=special["special_type"],
        in_special_zone=bool(zone["in_special_zone"]),
        special_zone_type=zone["special_zone_type"],
        special_center_grid_id=zone["special_center_grid_id"],
        polygon=polygon,
    )
