"""
랭킹 API 라우터 — 동기 버전
─────────────────────────
TerritoryStatus(OCCUPIED) + Organization JOIN → GROUP BY org_name
→ 점령 타일 수 상위 10개 대학 반환.

[엔드포인트]
  GET /api/ranking
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import Organization, TerritoryStatus, TerritoryStatusEnum
from schemas import RankingResponse

router = APIRouter()


@router.get("/ranking", response_model=list[RankingResponse])
def get_ranking(
    limit: int = Query(default=10, ge=1, le=50, description="반환할 최대 순위 수"),
    db: Session = Depends(get_db),
):
    """
    대학교별 점령 현황 랭킹을 반환한다.

    [SQL 로직]
      SELECT o.org_name, COUNT(ts.territory_id) AS tile_count
      FROM territory_status ts
      JOIN organizations o ON ts.org_id = o.org_id
      WHERE ts.status = 'OCCUPIED'
      GROUP BY o.org_name
      ORDER BY tile_count DESC
      LIMIT :limit
    """
    stmt = (
        select(
            Organization.org_name,
            func.count(TerritoryStatus.territory_id).label("tile_count"),
        )
        .join(Organization, TerritoryStatus.org_id == Organization.org_id)
        .where(TerritoryStatus.status == TerritoryStatusEnum.OCCUPIED)
        .group_by(Organization.org_name)
        .order_by(func.count(TerritoryStatus.territory_id).desc())
        .limit(limit)
    )

    rows = db.execute(stmt).all()

    return [
        RankingResponse(
            rank=idx + 1,
            university=row.org_name,
            tile_count=row.tile_count,
        )
        for idx, row in enumerate(rows)
    ]
