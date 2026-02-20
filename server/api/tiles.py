"""
타일(그리드) API 라우터
─────────────────────
지도 뷰포트 내의 타일 정보를 조회하고, 타일을 점령하는 엔드포인트를 제공한다.

[MVP 단계] DB 연동 전 더미 데이터를 반환해 프론트엔드 연동을 먼저 테스트한다.
"""

from datetime import datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel

from core.grid import get_viewport_grid_ids, grid_polygon

# ─── 라우터 생성 (prefix는 main.py에서 지정) ─────────────────
router = APIRouter()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 요청·응답 스키마
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class OccupyRequest(BaseModel):
    """
    타일 점령 요청 바디.
    - grid_id: 점령하려는 그리드 ID
    - university: 점령하는 대학교 이름
    """
    grid_id: str
    university: str


class TileResponse(BaseModel):
    """
    단일 타일 응답 스키마.
    프론트엔드에서 폴리곤을 그리는 데 필요한 모든 정보를 담는다.
    """
    grid_id: str
    owner_univ: str | None = None
    level: int = 0
    polygon: list[dict[str, float]]


class OccupyResponse(BaseModel):
    """타일 점령 결과 응답"""
    success: bool
    message: str
    tile: TileResponse


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 엔드포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.get("/tiles", response_model=list[TileResponse])
async def get_tiles(
    min_lat: float = Query(..., description="뷰포트 남쪽 경계 위도"),
    max_lat: float = Query(..., description="뷰포트 북쪽 경계 위도"),
    min_lng: float = Query(..., description="뷰포트 서쪽 경계 경도"),
    max_lng: float = Query(..., description="뷰포트 동쪽 경계 경도"),
):
    """
    지도 뷰포트 내의 모든 타일 정보를 반환한다.

    MVP 단계에서는 DB를 조회하지 않고,
    뷰포트 내 그리드를 계산한 뒤 더미 owner 데이터를 섞어서 반환한다.
    """
    grid_ids = get_viewport_grid_ids(min_lat, max_lat, min_lng, max_lng)

    # 뷰포트가 너무 넓으면 성능을 위해 최대 500개로 제한
    grid_ids = grid_ids[:500]

    tiles = []
    for i, gid in enumerate(grid_ids):
        polygon = grid_polygon(gid)

        # 더미 데이터: 3칸마다 하나씩 점령된 것으로 시뮬레이션
        owner = None
        level = 0
        if i % 5 == 0:
            owner = "서울대학교"
            level = 2
        elif i % 5 == 2:
            owner = "연세대학교"
            level = 1

        tiles.append(
            TileResponse(
                grid_id=gid,
                owner_univ=owner,
                level=level,
                polygon=polygon,
            )
        )

    return tiles


@router.post("/occupy", response_model=OccupyResponse)
async def occupy_tile(body: OccupyRequest):
    """
    특정 타일을 점령한다.

    MVP 단계에서는 실제 DB에 저장하지 않고 성공 응답만 반환한다.
    추후 DB 연동 시 Tile 레코드를 upsert 하도록 구현할 예정.
    """
    polygon = grid_polygon(body.grid_id)

    return OccupyResponse(
        success=True,
        message=f"'{body.university}'이(가) 타일 '{body.grid_id}'을(를) 점령했습니다!",
        tile=TileResponse(
            grid_id=body.grid_id,
            owner_univ=body.university,
            level=1,
            polygon=polygon,
        ),
    )
