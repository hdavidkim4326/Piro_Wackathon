"""
유저 API 라우터 — 동기 버전
─────────────────────────
이메일 인증 + 회원가입 엔드포인트.
DB 팀원의 SQLAlchemy 2.0 모델(User, Organization, UserOrganization)에 맞게 전환.

[매핑]
  프론트 nickname  →  User.user_name
  프론트 university →  Organization.org_name (이메일 도메인에서 추출)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
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
from database import get_db
from models import OccupationCategory, Organization, User, UserOrganization
from schemas import UserRead

router = APIRouter()

DEFAULT_CATEGORY_NAME = "대학교"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  스키마
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class VerifyEmailRequest(BaseModel):
    action: str
    email: str
    code: str | None = None


class VerifyEmailResponse(BaseModel):
    success: bool
    message: str
    university: str | None = None
    dev_code: str | None = None


class SignupSubmitRequest(BaseModel):
    email: str
    nickname: str
    university: str | None = None


class SignupSubmitResponse(BaseModel):
    success: bool
    message: str
    user: UserRead


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  엔드포인트
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/users/verify-email/", response_model=VerifyEmailResponse)
def verify_email(body: VerifyEmailRequest):
    """이메일 인증 코드 발송/검증 (DB 미사용, 인메모리 캐시)"""
    email = normalize_email(body.email)
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    action = body.action.strip().lower()

    if action == "send_email":
        university = extract_university(email)
        if not university:
            raise HTTPException(
                status_code=400,
                detail="Only allowed university domains can request verification.",
            )

        code = generate_verification_code()
        store_auth_code(email, code)
        send_verification_email(email, code)

        return VerifyEmailResponse(
            success=True,
            message="Verification code sent.",
            university=university,
            dev_code=code if settings.EMAIL_VERIFICATION_DEV_MODE else None,
        )

    if action == "check_number":
        if not body.code:
            raise HTTPException(status_code=400, detail="Verification code is required.")

        if not verify_auth_code(email, body.code.strip()):
            raise HTTPException(status_code=400, detail="Invalid or expired code.")

        university = extract_university(email)
        if not university:
            raise HTTPException(status_code=400, detail="Email domain is not allowed.")

        mark_email_verified(email, university)

        return VerifyEmailResponse(
            success=True,
            message="Email verification succeeded.",
            university=university,
        )

    raise HTTPException(status_code=400, detail="Unsupported action.")


@router.post("/users/signup/submit/", response_model=SignupSubmitResponse)
def signup_submit(
    body: SignupSubmitRequest,
    db: Session = Depends(get_db),
):
    """
    회원가입.
    1. 인증된 이메일에서 대학교를 추출
    2. User 생성 (user_name = nickname, email)
    3. Organization 연결 (get or create)
    4. UserOrganization 관계 생성
    """
    email = normalize_email(body.email)
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    nickname = body.nickname.strip()
    if len(nickname) < 2 or len(nickname) > 30:
        raise HTTPException(
            status_code=400,
            detail="Nickname must be between 2 and 30 characters.",
        )

    verified_university = get_verified_university(email)
    if not verified_university:
        raise HTTPException(
            status_code=400,
            detail="Email must be verified before signup.",
        )

    if body.university and body.university.strip() != verified_university:
        raise HTTPException(
            status_code=400,
            detail="University does not match verified email domain.",
        )

    # ── User 생성 ────────────────────────────────────────────
    user = User(user_name=nickname, email=email)
    db.add(user)
    db.flush()

    # ── Organization get/create ──────────────────────────────
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

    # ── UserOrganization 관계 생성 ───────────────────────────
    user_org = UserOrganization(user_id=user.user_id, org_id=org.org_id)
    db.add(user_org)

    db.commit()
    db.refresh(user)

    clear_verification_state(email)

    return SignupSubmitResponse(
        success=True,
        message="Signup complete.",
        user=UserRead(
            id=str(user.user_id),
            nickname=user.user_name,
            university=verified_university,
            created_at=user.created_at.isoformat(),
        ),
    )
