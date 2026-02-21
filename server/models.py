# models.py
from __future__ import annotations

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# -------------------------
# Core Tables
# -------------------------
class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Field: any | null
    field: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # relationships
    organizations: Mapped[list["UserOrganization"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    mission_sessions: Mapped[list["MissionSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    special_game_sessions: Mapped[list["SpecialGameSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class OccupationCategory(Base):
    __tablename__ = "occupation_categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # is_active: any | null  -> 일단 Boolean이 아니라 "의미불명"이라 JSON으로
    is_active: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[DateTime | None] = mapped_column(
        DateTime, nullable=True, server_default=func.now()
    )

    organizations: Mapped[list["Organization"]] = relationship(back_populates="category")
    territories: Mapped[list["Territory"]] = relationship(back_populates="category")
    special_territories: Mapped[list["SpecialTerritory"]] = relationship(
        back_populates="category"
    )


class Organization(Base):
    __tablename__ = "organizations"
    __table_args__ = (
        UniqueConstraint("org_name", name="uq_organizations_org_name"),
    )

    org_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("occupation_categories.category_id"), nullable=False
    )
    org_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # color_hex: number | null (int로)
    color_hex: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[DateTime | None] = mapped_column(
        DateTime, nullable=True, server_default=func.now()
    )

    # org_img: any | null  -> 파일/바이너리/URL 등 가능성. 일단 JSONB로 둠.
    org_img: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # relationships
    category: Mapped["OccupationCategory"] = relationship(back_populates="organizations")
    users: Mapped[list["UserOrganization"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    territory_statuses: Mapped[list["TerritoryStatus"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    special_territory_statuses: Mapped[list["SpecialTerritoryStatus"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )


class UserOrganization(Base):
    __tablename__ = "user_organizations"

    userorg_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.org_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=False)

    email_verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # relationships
    user: Mapped["User"] = relationship(back_populates="organizations")
    organization: Mapped["Organization"] = relationship(back_populates="users")


# -------------------------
# Mission / Territory
# -------------------------
class MissionTemplate(Base):
    __tablename__ = "mission_templates"

    mission_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    territories: Mapped[list["Territory"]] = relationship(back_populates="mission")
    mission_sessions: Mapped[list["MissionSession"]] = relationship(back_populates="mission")
    territory_statuses: Mapped[list["TerritoryStatus"]] = relationship(
        back_populates="mission", cascade="all, delete-orphan"
    )


class Territory(Base):
    __tablename__ = "territories"

    territory_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    mission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mission_templates.mission_id"), nullable=False
    )
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("occupation_categories.category_id"), nullable=False
    )

    # w3w: string | null
    w3w: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # relationships
    mission: Mapped["MissionTemplate"] = relationship(back_populates="territories")
    category: Mapped["OccupationCategory"] = relationship(back_populates="territories")

    mission_sessions: Mapped[list["MissionSession"]] = relationship(back_populates="territory")
    statuses: Mapped[list["TerritoryStatus"]] = relationship(
        back_populates="territory", cascade="all, delete-orphan"
    )


class TerritoryStatus(Base):
    """
    interface에 PK 정보가 없어서,
    보통 (territory_id, mission_id) 조합이 한 행을 유일하게 만든다고 가정하고 composite PK로 설정.
    (org_id는 "현재 점령한 팀"이라 nullable=True/False는 정책에 따라. 여기선 nullable=False로 둠)
    """

    __tablename__ = "territory_statuses"

    territory_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("territories.territory_id"), primary_key=True
    )
    mission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mission_templates.mission_id"), primary_key=True
    )
    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.org_id"), nullable=False)

    # 0: 점령 / 1: 무점령
    status: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # relationships
    territory: Mapped["Territory"] = relationship(back_populates="statuses")
    mission: Mapped["MissionTemplate"] = relationship(back_populates="territory_statuses")
    organization: Mapped["Organization"] = relationship(back_populates="territory_statuses")


class MissionSession(Base):
    __tablename__ = "mission_sessions"

    session_id: Mapped[int] = mapped_column("sessionId", Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=False)
    territory_id: Mapped[int] = mapped_column(Integer, ForeignKey("territories.territory_id"), nullable=False)
    mission_id: Mapped[int] = mapped_column(Integer, ForeignKey("mission_templates.mission_id"), nullable=False)

    # mission_status: any | null (성공/실패/진행중 문자열일 수도)
    mission_status: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[DateTime | None] = mapped_column(
        DateTime, nullable=True, server_default=func.now()
    )

    # relationships
    user: Mapped["User"] = relationship(back_populates="mission_sessions")
    territory: Mapped["Territory"] = relationship(back_populates="mission_sessions")
    mission: Mapped["MissionTemplate"] = relationship(back_populates="mission_sessions")


# -------------------------
# Special Game / Special Territory
# -------------------------
class SpecialGame(Base):
    __tablename__ = "special_games"

    sp_game_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    special_territories: Mapped[list["SpecialTerritory"]] = relationship(back_populates="game")
    sessions: Mapped[list["SpecialGameSession"]] = relationship(back_populates="game")


class SpecialTerritory(Base):
    __tablename__ = "special_territories"

    # any -> 우선 Integer PK
    sp_territory_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    sp_game_id: Mapped[int] = mapped_column(Integer, ForeignKey("special_games.sp_game_id"), nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("occupation_categories.category_id"), nullable=False
    )

    sp_w3w: Mapped[str | None] = mapped_column(String(255), nullable=True)
    effect_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # relationships
    game: Mapped["SpecialGame"] = relationship(back_populates="special_territories")
    category: Mapped["OccupationCategory"] = relationship(back_populates="special_territories")

    statuses: Mapped[list["SpecialTerritoryStatus"]] = relationship(
        back_populates="special_territory", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["SpecialGameSession"]] = relationship(back_populates="special_territory")


class SpecialTerritoryStatus(Base):
    """
    interface에 PK 정보가 없어서
    (sp_territory_id, sp_game_id) composite PK로 가정.
    """

    __tablename__ = "special_territory_statuses"

    sp_territory_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("special_territories.sp_territory_id"), primary_key=True
    )
    sp_game_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("special_games.sp_game_id"), primary_key=True
    )
    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.org_id"), nullable=False)

    # 0: 점령 / 1: 무결정
    status: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # relationships
    special_territory: Mapped["SpecialTerritory"] = relationship(back_populates="statuses")
    game: Mapped["SpecialGame"] = relationship()
    organization: Mapped["Organization"] = relationship(back_populates="special_territory_statuses")


class SpecialGameSession(Base):
    __tablename__ = "special_game_sessions"

    # any -> 우선 Integer PK
    sp_session_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=False)
    sp_territory_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("special_territories.sp_territory_id"), nullable=False
    )
    sp_game_id: Mapped[int] = mapped_column(Integer, ForeignKey("special_games.sp_game_id"), nullable=False)

    # 0: 성공 / 1: 실패 / 2: 진행 중
    mission_status: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[DateTime | None] = mapped_column(
        DateTime, nullable=True, server_default=func.now()
    )

    # relationships
    user: Mapped["User"] = relationship(back_populates="special_game_sessions")
    special_territory: Mapped["SpecialTerritory"] = relationship(back_populates="sessions")
    game: Mapped["SpecialGame"] = relationship(back_populates="sessions")
