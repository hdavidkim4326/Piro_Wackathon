"""
API 요청/응답 Pydantic 스키마
────────────────────────────
프론트엔드 JSON 규격과 DB 모델 사이의 번역 계층.
"""

from typing import Optional

from pydantic import BaseModel, Field


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  타일
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TileRead(BaseModel):
    grid_id: str
    owner_univ: Optional[str] = None
    level: int = 0
    is_special: bool = False
    special_type: Optional[str] = None  # "3x3" | "5x5"
    in_special_zone: bool = False
    special_zone_type: Optional[str] = None  # "3x3" | "5x5"
    special_center_grid_id: Optional[str] = None
    polygon: list[dict[str, float]] = Field(default_factory=list)


class TileOccupyRequest(BaseModel):
    grid_id: str
    university: str
    level: int = Field(default=1, ge=1)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  랭킹
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class RankingResponse(BaseModel):
    rank: int
    university: str
    tile_count: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  유저 / 인증
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class UserRead(BaseModel):
    """프론트엔드 호환 유저 응답."""
    id: str
    nickname: str
    university: str
    created_at: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: UserRead


class UserStatsResponse(BaseModel):
    user_id: str
    nickname: str
    university: str
    capture_count: int
    unique_capture_count: int
    contribution_score: int
    organization_tile_count: int
