"""
Campus Turf War — FastAPI 메인 엔트리포인트 (동기 버전)
──────────────────────────────────────────────────────
DB 팀원의 동기 engine(create_engine)에 맞춰 전환.
서버 시작 시 Base.metadata.create_all()로 테이블을 자동 생성한다.

[서비스 구동 흐름]
  1. lifespan → create_all 로 테이블 자동 생성
  2. CORS 미들웨어 등록 (개발: allow all)
  3. /api 하위에 tiles, ranking, users 라우터 마운트
  4. /health 헬스체크
  5. /api/docs Swagger UI
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.tiles import router as tiles_router
from api.ranking import router as ranking_router
from api.users import router as users_router
from api.games import router as games_router
from database import engine
from models import Base


# ─── 앱 라이프사이클 ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작 시 모든 테이블을 동기적으로 생성한다."""
    Base.metadata.create_all(bind=engine)
    yield


# ─── FastAPI 앱 인스턴스 ─────────────────────────────────────
app = FastAPI(
    title="Campus Turf War API",
    description="대학교 진영 지도 점령 게임 백엔드 API",
    version="0.3.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# ─── CORS 미들웨어 ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 라우터 등록 ─────────────────────────────────────────────
app.include_router(tiles_router, prefix="/api", tags=["tiles"])
app.include_router(ranking_router, prefix="/api", tags=["ranking"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(games_router, prefix="/api", tags=["games"])


# ─── 헬스체크 ────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """서버 상태 확인용 엔드포인트"""
    return {"status": "ok", "service": "Campus Turf War API"}
