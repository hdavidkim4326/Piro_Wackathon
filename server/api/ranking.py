"""
랭킹 API 라우터
──────────────
대학교별 점령 타일 수를 집계해서 상위 10개 대학을 순위와 함께 반환한다.
SQLAlchemy의 func.count + group_by를 비동기로 실행한다.

[엔드포인트 요약]
  GET /api/ranking → 대학교별 점령 타일 수 TOP 10
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from database import get_session
from models import Tile, RankingEntry

router = APIRouter()


@router.get("/ranking", response_model=list[RankingEntry])
async def get_ranking(
    limit: int = Query(default=10, ge=1, le=50, description="반환할 최대 순위 수"),
    session: AsyncSession = Depends(get_session),
):
    """
    대학교별 점령 현황 랭킹을 반환한다.

    [쿼리 로직]
      SELECT owner_univ, COUNT(*) AS tile_count
      FROM tile
      WHERE owner_univ IS NOT NULL
      GROUP BY owner_univ
      ORDER BY tile_count DESC
      LIMIT :limit

    owner_univ가 NULL인 타일(비점령)은 집계에서 제외한다.
    """
    stmt = (
        select(
            Tile.owner_univ,
            func.count(Tile.id).label("tile_count"),
        )
        .where(Tile.owner_univ.is_not(None))
        .group_by(Tile.owner_univ)
        .order_by(func.count(Tile.id).desc())
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.all()

    # 순위(rank)는 1부터 시작하는 인덱스로 부여
    return [
        RankingEntry(
            rank=idx + 1,
            university=row.owner_univ,
            tile_count=row.tile_count,
        )
        for idx, row in enumerate(rows)
    ]
