"""
타일(그리드) API 라우터
─────────────────────
지도 뷰포트 내의 타일 정보를 조회하고, 타일을 점령하는 엔드포인트를 제공한다.
모든 쿼리는 asyncpg 비동기 세션을 통해 PostgreSQL과 통신한다.

[엔드포인트 요약]
  GET  /api/tiles   → 뷰포트 내 타일 목록 조회 (DB + 빈 그리드 병합)
  POST /api/occupy  → 타일 점령 (INSERT or UPDATE)
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from core.grid import get_viewport_grid_ids, grid_polygon
from database import get_session
from models import Tile, TileCreate, TileRead

router = APIRouter()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GET /api/tiles — 뷰포트 내 타일 조회
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/tiles", response_model=list[TileRead])
async def get_tiles(
    min_lat: float = Query(..., description="뷰포트 남쪽 경계 위도"),
    max_lat: float = Query(..., description="뷰포트 북쪽 경계 위도"),
    min_lng: float = Query(..., description="뷰포트 서쪽 경계 경도"),
    max_lng: float = Query(..., description="뷰포트 동쪽 경계 경도"),
    session: AsyncSession = Depends(get_session),
):
    """
    지도 뷰포트 안에 있는 모든 타일 정보를 반환한다.

    1. 뷰포트 좌표로 해당 영역의 grid_id 목록을 계산한다.
    2. DB에서 해당 grid_id들의 점령 정보를 조회한다.
    3. DB에 없는 grid_id는 빈 타일(owner_univ=None)로 채운다.
    4. 각 타일에 polygon 좌표를 붙여서 반환한다.
    """
    # 뷰포트 내 모든 grid_id 계산
    grid_ids = get_viewport_grid_ids(min_lat, max_lat, min_lng, max_lng)

    # 성능 보호: 한 번에 최대 500개 그리드만 처리
    grid_ids = grid_ids[:500]

    if not grid_ids:
        return []

    # DB에서 해당 grid_id들의 점령 정보를 한번에 조회
    stmt = select(Tile).where(Tile.grid_id.in_(grid_ids))
    result = await session.execute(stmt)
    db_tiles = result.scalars().all()

    # grid_id → DB 레코드 매핑 (O(1) 조회용)
    tile_map: dict[str, Tile] = {t.grid_id: t for t in db_tiles}

    # 응답 조립: DB 레코드가 있으면 사용, 없으면 빈 타일 생성
    response: list[TileRead] = []
    for gid in grid_ids:
        polygon = grid_polygon(gid)

        if gid in tile_map:
            t = tile_map[gid]
            response.append(
                TileRead(
                    id=t.id,
                    grid_id=t.grid_id,
                    owner_univ=t.owner_univ,
                    level=t.level,
                    occupied_at=t.occupied_at,
                    polygon=polygon,
                )
            )
        else:
            # DB에 없는 타일 → 비점령 상태로 반환 (id=0은 "DB 미저장" 표시)
            response.append(
                TileRead(
                    id=0,
                    grid_id=gid,
                    owner_univ=None,
                    level=0,
                    occupied_at=None,
                    polygon=polygon,
                )
            )

    return response


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /api/occupy — 타일 점령
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/occupy", response_model=TileRead)
async def occupy_tile(
    body: TileCreate,
    session: AsyncSession = Depends(get_session),
):
    """
    특정 타일을 점령한다 (Upsert 방식).

    - grid_id가 DB에 없으면 → 새 레코드를 INSERT 한다.
    - grid_id가 DB에 이미 있으면 → owner_univ, level을 UPDATE 한다.

    TODO: DB 팀원 작업 영역
      - 같은 대학이 재점령하면 level++, 다른 대학이면 level=1 같은 룰 추가
      - 점령 쿨타임, 거리 제한 등 비즈니스 로직 이 함수에 추가
    """
    # 기존 타일 조회
    stmt = select(Tile).where(Tile.grid_id == body.grid_id)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        # UPDATE — 기존 타일의 소유권을 덮어쓴다
        existing.owner_univ = body.university
        existing.level = body.level
        existing.occupied_at = datetime.utcnow()
        tile = existing
    else:
        # INSERT — 새 타일 레코드 생성
        tile = Tile(
            grid_id=body.grid_id,
            owner_univ=body.university,
            level=body.level,
            occupied_at=datetime.utcnow(),
        )
        session.add(tile)

    await session.commit()
    await session.refresh(tile)

    polygon = grid_polygon(tile.grid_id)

    return TileRead(
        id=tile.id,
        grid_id=tile.grid_id,
        owner_univ=tile.owner_univ,
        level=tile.level,
        occupied_at=tile.occupied_at,
        polygon=polygon,
    )
