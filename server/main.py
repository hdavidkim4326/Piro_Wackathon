"""
Campus Turf War — FastAPI 메인 엔트리포인트 (동기 버전)
──────────────────────────────────────────────────────
서버 시작 시 테이블 생성 + 기존 DB 자동 마이그레이션.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from api.tiles import router as tiles_router
from api.ranking import router as ranking_router
from api.users import router as users_router
from api.games import router as games_router
from database import engine
from models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    # 기존 users 테이블에 누락 컬럼이 있으면 자동 추가
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "password_hash" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        if "field" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN field JSONB"))

    if "user_organizations" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("user_organizations")]
        if "email_verified" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text("ALTER TABLE user_organizations ADD COLUMN email_verified BOOLEAN")
                )

    yield


app = FastAPI(
    title="Campus Turf War API",
    description="대학교 진영 지도 점령 게임 백엔드 API",
    version="0.4.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tiles_router, prefix="/api", tags=["tiles"])
app.include_router(ranking_router, prefix="/api", tags=["ranking"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(games_router, prefix="/api", tags=["games"])


@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "Campus Turf War API"}
