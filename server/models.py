"""
데이터 모델 정의
───────────────
SQLModel을 사용해 User와 Tile 테이블을 정의한다.
SQLModel은 SQLAlchemy + Pydantic이 합쳐진 라이브러리라서
ORM 모델과 API 스키마를 한 클래스로 처리할 수 있다.
"""

# models.py
# SQLAlchemy 2.0 style (Mapped / mapped_column)
# Postgres 기준 UUID 사용

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# -----------------------------
# Base
# -----------------------------
class Base(DeclarativeBase):
    pass


# -----------------------------
# Enums (status 컬럼은 가능한 ENUM 추천)
# -----------------------------
class MissionStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class TerritoryStatusEnum(str, enum.Enum):
    # 너희 게임 규칙에 맞게 값은 바꿔도 됨
    NEUTRAL = "NEUTRAL"        # 미점령/중립
    OCCUPIED = "OCCUPIED"      # 점령됨


# -----------------------------
# Tables
# -----------------------------
class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user_organizations: Mapped[List["UserOrganization"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    mission_sessions: Mapped[List["MissionSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    territory_occupation_histories: Mapped[List["TerritoryOccupationHistory"]] = relationship(
        back_populates="user"
    )


class OccupationCategory(Base):
    __tablename__ = "occupation_categories"

    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    organizations: Mapped[List["Organization"]] = relationship(
        back_populates="category"
    )
    territories: Mapped[List["Territory"]] = relationship(
        back_populates="category"
    )
    territory_occupation_histories: Mapped[List["TerritoryOccupationHistory"]] = relationship(
        back_populates="category"
    )


class Organization(Base):
    __tablename__ = "organizations"

    org_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("occupation_categories.category_id", ondelete="RESTRICT"),
        nullable=False,
    )
    org_name: Mapped[str] = mapped_column(String(120), nullable=False)


    org_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    color_hex: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # "#RRGGBB"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    category: Mapped["OccupationCategory"] = relationship(back_populates="organizations")

    user_organizations: Mapped[List["UserOrganization"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )

    territory_statuses: Mapped[List["TerritoryStatus"]] = relationship(
        back_populates="organization"
    )
    
    territory_occupation_histories: Mapped[List["TerritoryOccupationHistory"]] = relationship(
        back_populates="organization"
    )

    __table_args__ = (
        UniqueConstraint("category_id", "org_name", name="uq_org_category_name"),
        Index("idx_org_category", "category_id"),
    )


class UserOrganization(Base):
    __tablename__ = "user_organizations"

    userorg_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.org_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    organization: Mapped["Organization"] = relationship(back_populates="user_organizations")
    user: Mapped["User"] = relationship(back_populates="user_organizations")

    __table_args__ = (
        UniqueConstraint("org_id", "user_id", name="uq_user_org_unique"),
        Index("idx_userorg_user", "user_id"),
        Index("idx_userorg_org", "org_id"),
    )


class Territory(Base):
    __tablename__ = "territories"

    territory_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("occupation_categories.category_id", ondelete="CASCADE"),
        nullable=False,
    )
    # w3w를 한 컬럼으로 합친 버전 (예: "apple.banana.clock")
    w3w: Mapped[str] = mapped_column(String(128), nullable=False)

    category: Mapped["OccupationCategory"] = relationship(back_populates="territories")

    # 1:1 현재 상태 (territory_status.territory_id가 PK/FK)
    status_row: Mapped[Optional["TerritoryStatus"]] = relationship(
        back_populates="territory",
        uselist=False,
        cascade="all, delete-orphan",
    )

    mission_sessions: Mapped[List["MissionSession"]] = relationship(
        back_populates="territory"
    )

    occupations: Mapped[List["TerritoryOccupation"]] = relationship(
        back_populates="territory"
    )

    occupation_histories: Mapped[List["TerritoryOccupationHistory"]] = relationship(
        back_populates="territory"
    )

    __table_args__ = (
        UniqueConstraint("category_id", "w3w", name="uq_territory_category_w3w"),
        Index("idx_territory_category", "category_id"),
    )


class TerritoryStatus(Base):
    """
    '현재 상태' 테이블.
    - territory_id를 PK로 두면 Territory와 1:1이 보장됨
    - 상태가 바뀔 때마다 INSERT가 아니라 UPDATE됨
    """
    __tablename__ = "territory_status"

    territory_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.territory_id", ondelete="CASCADE"),
        primary_key=True,
    )

    org_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.org_id", ondelete="SET NULL"),
        nullable=True,  # 중립이면 NULL
    )

    status: Mapped[TerritoryStatusEnum] = mapped_column(
        String(20),  # Enum 타입을 DB ENUM으로 만들고 싶으면 별도 설정 가능
        nullable=False,
        default=TerritoryStatusEnum.NEUTRAL.value,
    )

    protected_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    territory: Mapped["Territory"] = relationship(back_populates="status_row")
    organization: Mapped[Optional["Organization"]] = relationship(back_populates="territory_statuses")

    __table_args__ = (
        Index("idx_territory_status_org", "org_id"),
        Index("idx_territory_status_protected_until", "protected_until"),
    )


class MissionTemplate(Base):
    __tablename__ = "mission_templates"

    mission_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    mission_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1~3 체크는 앱단/DB단 둘 다 가능
    defend_time: Mapped[int] = mapped_column(Integer, nullable=False)     # 단위(초/분) 팀에서 합의 필요
    mission_title: Mapped[str] = mapped_column(String(120), nullable=False)
    mission_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    sessions: Mapped[List["MissionSession"]] = relationship(
        back_populates="mission_template"
    )

    __table_args__ = (
        Index("idx_mission_level", "mission_level"),
    )


class MissionSession(Base):
    __tablename__ = "mission_sessions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    mission_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("mission_templates.mission_id", ondelete="RESTRICT"),
        nullable=False,
    )
    territory_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.territory_id", ondelete="CASCADE"),
        nullable=False,
    )

    # DB ENUM을 쓰고 싶으면 별도 Enum 타입 생성 권장
    mission_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=MissionStatus.ASSIGNED.value
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="mission_sessions")
    mission_template: Mapped["MissionTemplate"] = relationship(back_populates="sessions")
    territory: Mapped["Territory"] = relationship(back_populates="mission_sessions")

    # 점령 기록(이 세션이 점령으로 이어졌는지)
    occupation: Mapped[Optional["TerritoryOccupation"]] = relationship(
        back_populates="mission_session", uselist=False
    )

    __table_args__ = (
        Index("idx_session_user", "user_id"),
        Index("idx_session_territory", "territory_id"),
        Index("idx_session_status", "mission_status"),
    )


class TerritoryOccupationHistory(Base):
    """
    점령 '기록' 테이블(히스토리).
    - 점령 발생 시마다 INSERT
    """
    __tablename__ = "territory_occupation_histories"

    occupation_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    territory_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.territory_id", ondelete="CASCADE"),
        nullable=False,
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("occupation_categories.category_id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.org_id", ondelete="RESTRICT"),
        nullable=False,
    )

    protected_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    level: Mapped[int] = mapped_column(Integer, nullable=False)

    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # relationships
    territory: Mapped["Territory"] = relationship(
        back_populates="occupation_histories"
    )
    category: Mapped["OccupationCategory"] = relationship(
        back_populates="territory_occupation_histories"
    )
    user: Mapped[Optional["User"]] = relationship(
        back_populates="territory_occupation_histories"
    )
    organization: Mapped["Organization"] = relationship(
        back_populates="territory_occupation_histories"
    )

    __table_args__ = (
        Index("idx_occ_hist_territory", "territory_id"),
        Index("idx_occ_hist_category", "category_id"),
        Index("idx_occ_hist_user", "user_id"),
        Index("idx_occ_hist_org", "org_id"),
        Index("idx_occ_hist_protected_until", "protected_until"),
        Index("idx_occ_hist_claimed_at", "claimed_at"),
    )


# ─── DB 팀원 모델에서 누락된 부분 보완 ──────────────────────
class TerritoryOccupation(Base):
    """
    미션 성공 시 생성되는 '점령 결과' 레코드.
    MissionSession 1:1, Territory N:1 관계.
    """
    __tablename__ = "territory_occupations"

    occupation_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("mission_sessions.session_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    territory_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.territory_id", ondelete="CASCADE"),
        nullable=False,
    )
    occupied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    mission_session: Mapped["MissionSession"] = relationship(
        back_populates="occupation"
    )
    territory: Mapped["Territory"] = relationship(
        back_populates="occupations"
    )