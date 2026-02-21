from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

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
from database import get_session
from models import User, UserRead

router = APIRouter()


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


@router.post("/users/verify-email/", response_model=VerifyEmailResponse)
async def verify_email(body: VerifyEmailRequest):
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

        code = body.code.strip()
        if not verify_auth_code(email, code):
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
async def signup_submit(
    body: SignupSubmitRequest,
    session: AsyncSession = Depends(get_session),
):
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

    user = User(nickname=nickname, university=verified_university)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    clear_verification_state(email)

    return SignupSubmitResponse(
        success=True,
        message="Signup complete.",
        user=UserRead(
            id=user.id,
            nickname=user.nickname,
            university=user.university,
            created_at=user.created_at,
        ),
    )
