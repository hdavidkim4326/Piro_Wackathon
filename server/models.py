"""
데이터 모델 정의
───────────────
SQLModel을 사용해 User와 Tile 테이블을 정의한다.
SQLModel은 SQLAlchemy + Pydantic이 합쳐진 라이브러리라서
ORM 모델과 API 스키마를 한 클래스로 처리할 수 있다.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# User 모델 — 게임에 참가하는 사용자
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class User(SQLModel, table=True):
    """
    사용자 테이블.
    - nickname: 인게임 닉네임
    - university: 소속 대학교 (팀 구분 기준)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    nickname: str = Field(index=True, max_length=30)
    university: str = Field(max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Tile 모델 — 지도 위의 30m × 30m 그리드 한 칸
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Tile(SQLModel, table=True):
    """
    타일(그리드 칸) 테이블.
    - grid_id: 위도/경도를 바탕으로 계산한 고유 그리드 식별자
                예: "grid_132048_382941"
    - owner_univ: 이 타일을 점령한 대학교 이름 (없으면 None)
    - level: 점령 강화 레벨 (기본 1, 중첩 점령 시 증가)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    grid_id: str = Field(unique=True, index=True, max_length=40)
    owner_univ: Optional[str] = Field(default=None, max_length=50)
    level: int = Field(default=1)
    occupied_at: Optional[datetime] = Field(default=None)
