"""
API 요청/응답 Pydantic 스키마
────────────────────────────
프론트엔드가 사용하는 JSON 규격(grid_id, owner_univ, level)과
DB 팀원의 SQLAlchemy 모델 사이를 양방향 번역하는 계층.

[프론트엔드 ↔ 스키마 ↔ DB 매핑]
  grid_id    ←→  Territory.w3w
  owner_univ ←→  Organization.org_name
  level      ←→  TerritoryOccupationHistory.level (최신 기록)
"""

from typing import Optional

from pydantic import BaseModel, Field


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  타일 스키마
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TileRead(BaseModel):
    """
    타일 조회 응답.
    프론트에서 폴리곤을 그리는 데 필요한 모든 정보.
    """

    grid_id: str
    owner_univ: Optional[str] = None
    level: int = 0
    polygon: list[dict[str, float]] = Field(default_factory=list)


class TileOccupyRequest(BaseModel):
    """
    타일 점령 요청 바디.
    프론트엔드 POST /api/occupy 에서 보내는 JSON.
    """

    grid_id: str
    university: str
    level: int = Field(default=1, ge=1)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  랭킹 스키마
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class RankingResponse(BaseModel):
    """
    랭킹 응답 개별 항목.
    대학교 이름과 점령한 타일 수.
    """

    rank: int
    university: str
    tile_count: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  유저 스키마
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class UserRead(BaseModel):
    """
    유저 조회 응답.
    프론트엔드 호환을 위해 nickname/university 필드를 유지한다.
    DB: user_name → nickname, Organization.org_name → university
    """

    id: str
    nickname: str
    university: str
    created_at: str
