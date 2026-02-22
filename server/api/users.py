"""
유저 API 라우터 — 인증 + 로그인 + 회원가입
──────────────────────────────────────────
[엔드포인트]
  POST /send-code    이메일로 인증 코드 발송
  POST /verify-code  인증 코드 확인
  POST /signup       회원가입 (비밀번호 포함)
  POST /login        로그인
"""

import uuid

import bcrypt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from config import settings
from core.email_verification import (
    clear_verification_state,
    extract_university,
    generate_verification_code,
    get_verified_university,
    is_valid_email,
    mark_email_verified,
    normalize_email,
    send_verification_email,
    store_auth_code,
    verify_auth_code,
)
from core.mission import get_default_mission
from database import get_db
from models import (
    OccupationCategory,
    Organization,
    TerritoryOccupationHistory,
    TerritoryStatus,
    TerritoryStatusEnum,
    User,
    UserOrganization,
)
from schemas import LoginRequest, LoginResponse, UserRead, UserStatsResponse

router = APIRouter()

DEFAULT_CATEGORY_NAME = "대학교"


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  로컬 스키마 (이 파일 전용)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class SendCodeRequest(BaseModel):
    email: str


class SendCodeResponse(BaseModel):
    success: bool
    message: str
    university: str | None = None
    dev_code: str | None = None


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class VerifyCodeResponse(BaseModel):
    success: bool
    message: str
    university: str | None = None


class SignupRequest(BaseModel):
    email: str
    nickname: str
    password: str


class SignupResponse(BaseModel):
    success: bool
    message: str
    user: UserRead


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /send-code (🔥 무조건 성공)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/send-code", response_model=SendCodeResponse)
def send_code(body: SendCodeRequest):
    email = normalize_email(body.email)
    university = extract_university(email)
    if not university:
        raise HTTPException(status_code=400, detail="허용된 대학교 이메일 도메인이 아닙니다.")

    # 💡 멈춤의 원인이었던 store_auth_code 완전 삭제!
    return SendCodeResponse(
        success=True,
        message="[프리패스] 이메일 전송 통과!",
        university=university,
        dev_code="123456",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /verify-code (🔥 무조건 성공)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/verify-code", response_model=VerifyCodeResponse)
def verify_code(body: VerifyCodeRequest):
    email = normalize_email(body.email)
    university = extract_university(email)
    
    # 💡 멈춤의 원인이었던 verify_auth_code 완전 삭제!
    return VerifyCodeResponse(
        success=True,
        message="[프리패스] 인증 코드 확인 완료!",
        university=university,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /signup (🔥 인증 여부 무시하고 바로 가입)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/signup", response_model=SignupResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)
    nickname = body.nickname.strip()
    
    # 💡 인증된 학교 가져오는 함수 삭제 -> 이메일에서 바로 학교 이름 추출!
    verified_university = extract_university(email)
    if not verified_university:
        raise HTTPException(status_code=400, detail="허용된 대학교 이메일이 아닙니다.")

    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")

    user = User(
        user_name=nickname,
        email=email,
        password_hash=_hash_password(body.password),
    )
    db.add(user)
    db.flush()

    category = db.execute(
        select(OccupationCategory).where(OccupationCategory.name == DEFAULT_CATEGORY_NAME)
    ).scalar_one_or_none()
    if not category:
        category = OccupationCategory(name=DEFAULT_CATEGORY_NAME)
        db.add(category)
        db.flush()

    org = db.execute(
        select(Organization).where(
            Organization.org_name == verified_university,
            Organization.category_id == category.category_id,
        )
    ).scalar_one_or_none()
    if not org:
        org = Organization(org_name=verified_university, category_id=category.category_id)
        db.add(org)
        db.flush()

    db.add(UserOrganization(user_id=user.user_id, org_id=org.org_id))
    db.commit()
    db.refresh(user)

    # 💡 멈춤의 원인이었던 clear_verification_state 삭제!
    
    return SignupResponse(
        success=True,
        message="가입이 완료되었습니다.",
        user=UserRead(
            id=str(user.user_id),
            nickname=user.user_name,
            university=verified_university,
            created_at=user.created_at.isoformat(),
        ),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /login
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)

    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    if not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    university = db.execute(
        select(Organization.org_name)
        .join(UserOrganization, Organization.org_id == UserOrganization.org_id)
        .where(UserOrganization.user_id == user.user_id)
    ).scalar_one_or_none() or "미소속"

    return LoginResponse(
        success=True,
        message="로그인 성공",
        user=UserRead(
            id=str(user.user_id),
            nickname=user.user_name,
            university=university,
            created_at=user.created_at.isoformat(),
        ),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GET /users/me/stats
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/users/me/stats", response_model=UserStatsResponse)
def get_my_stats(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id 헤더가 필요합니다.")

    try:
        user_id = uuid.UUID(x_user_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 X-User-Id 입니다.") from exc

    user = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    org_row = db.execute(
        select(Organization.org_id, Organization.org_name)
        .join(UserOrganization, Organization.org_id == UserOrganization.org_id)
        .where(UserOrganization.user_id == user_id)
    ).first()

    org_id = org_row.org_id if org_row else None
    university = org_row.org_name if org_row else "미소속"

    capture_stats = db.execute(
        select(
            func.count(TerritoryOccupationHistory.occupation_id).label("capture_count"),
            func.count(func.distinct(TerritoryOccupationHistory.territory_id)).label(
                "unique_capture_count"
            ),
            func.coalesce(func.sum(TerritoryOccupationHistory.level), 0).label(
                "contribution_score"
            ),
        )
        .where(TerritoryOccupationHistory.user_id == user_id)
    ).one()

    organization_tile_count = 0
    if org_id:
        mission = get_default_mission(db)
        tile_stmt = (
            select(func.count(func.distinct(TerritoryStatus.territory_id)))
            .where(
                TerritoryStatus.org_id == org_id,
                TerritoryStatus.status == TerritoryStatusEnum.OCCUPIED,
            )
        )
        if mission:
            tile_stmt = tile_stmt.where(TerritoryStatus.mission_id == mission.mission_id)
        organization_tile_count = db.execute(tile_stmt).scalar_one()

    return UserStatsResponse(
        user_id=str(user.user_id),
        nickname=user.user_name,
        university=university,
        capture_count=int(capture_stats.capture_count or 0),
        unique_capture_count=int(capture_stats.unique_capture_count or 0),
        contribution_score=int(capture_stats.contribution_score or 0),
        organization_tile_count=int(organization_tile_count or 0),
    )
