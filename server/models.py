"""
데이터 모델 & API 스키마 정의
───────────────────────────
[설계 원칙]
  1. Base 모델(필드 정의)과 Table 모델(DB 테이블)을 분리한다.
     → DB 팀원은 Table 모델에 컬럼만 추가하면 되고,
       프론트 팀원은 Base/Read 스키마만 보면 된다.
  2. Pydantic 요청·응답 스키마도 Base를 상속해서 만든다.
     → 필드 중복 정의를 완전히 제거한다.

[파일 구조]
  UserBase  ──▶  User(table=True)
            ──▶  UserRead (응답 스키마)

  TileBase  ──▶  Tile(table=True)
            ──▶  TileCreate  (점령 요청 스키마)
            ──▶  TileRead    (단일 타일 응답 — polygon 포함)
            ──▶  TileUpdate  (수정 요청 스키마)
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  User
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class UserBase(SQLModel):
    """
    사용자 공통 필드 (Base).
    테이블 모델과 API 스키마가 공유하는 최소 필드만 정의한다.
    """

    nickname: str = Field(index=True, max_length=30, description="인게임 닉네임")
    university: str = Field(max_length=50, description="소속 대학교 (팀 구분 기준)")


class User(UserBase, table=True):
    """
    ┌──────────────────────────────────────────────────────┐
    │  users 테이블                                        │
    │  PK: id (auto increment)                             │
    │  ──────────────────────────────────────────────────── │
    │  TODO: DB 팀원 작업 영역                              │
    │  - ERD 완성 후 프로필 이미지(avatar_url) 추가          │
    │  - 총점(total_score) 필드 추가                        │
    │  - 이메일, 비밀번호 해시 등 인증 관련 필드 추가         │
    │  - 최근 접속 시각(last_login_at) 추가                 │
    └──────────────────────────────────────────────────────┘
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRead(UserBase):
    """User 조회 응답 스키마 — id, created_at 포함"""

    id: int
    created_at: datetime


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Tile
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TileBase(SQLModel):
    """
    타일 공통 필드 (Base).
    grid_id 가 실질적 식별자이며, 좌표 계산은 core/grid.py 에서 처리한다.
    """

    grid_id: str = Field(
        max_length=40,
        description='그리드 고유 ID (예: "grid_139131_373471")',
    )
    owner_univ: Optional[str] = Field(
        default=None, max_length=50, description="점령한 대학교 이름"
    )
    level: int = Field(default=1, ge=1, description="점령 강화 레벨")


class Tile(TileBase, table=True):
    """
    ┌──────────────────────────────────────────────────────┐
    │  tiles 테이블                                        │
    │  PK: id (auto)  /  UNIQUE: grid_id                   │
    │  ──────────────────────────────────────────────────── │
    │  TODO: DB 팀원 작업 영역                              │
    │  - 최종 점령자 닉네임(occupier_nickname) 추가          │
    │  - 점령 인증 사진 URL(proof_image_url) 추가           │
    │  - 점령 시각(occupied_at) → 타임존 처리 검토           │
    │  - 누적 점령 횟수(occupy_count) 추가                  │
    │  - User FK 관계 설정 (occupier_id → users.id)         │
    └──────────────────────────────────────────────────────┘
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    grid_id: str = Field(unique=True, index=True, max_length=40)
    occupied_at: Optional[datetime] = Field(default=None)


# ─── Pydantic 요청 / 응답 스키마 ─────────────────────────────

class TileCreate(SQLModel):
    """
    타일 점령(생성) 요청 스키마.
    프론트엔드에서 POST /api/occupy 로 보내는 JSON 바디.
    """

    grid_id: str = Field(description="점령할 그리드 ID")
    university: str = Field(description="점령하는 대학교 이름")
    level: int = Field(default=1, ge=1, description="초기 점령 레벨")


class TileUpdate(SQLModel):
    """
    타일 정보 수정 요청 스키마.
    부분 업데이트를 지원하기 위해 모든 필드를 Optional로 둔다.
    TODO: DB 팀원 작업 영역 — 필드 추가 시 여기에도 Optional 필드를 추가
    """

    owner_univ: Optional[str] = None
    level: Optional[int] = Field(default=None, ge=1)


class TileRead(TileBase):
    """
    타일 조회 응답 스키마.
    DB 레코드 + 계산된 polygon 좌표를 함께 반환한다.
    """

    id: int
    occupied_at: Optional[datetime] = None
    polygon: list[dict[str, float]] = Field(
        default_factory=list,
        description="폴리곤 꼭짓점 좌표 [SW, NW, NE, SE]",
    )


# ─── 랭킹 응답 스키마 ────────────────────────────────────────

class RankingEntry(SQLModel):
    """
    랭킹 API 응답의 개별 항목.
    대학교 이름과 점령한 타일 수를 포함한다.
    """

    rank: int
    university: str
    tile_count: int
