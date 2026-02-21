"""
Campus Turf War — FastAPI 메인 엔트리포인트
──────────────────────────────────────────
앱 인스턴스를 생성하고, CORS 미들웨어를 설정하고,
라우터를 등록하고, 서버 시작 시 DB 테이블을 초기화한다.

[서비스 구동 흐름]
  1. lifespan → init_db() 로 테이블 자동 생성
  2. CORS 미들웨어 등록 (개발: allow all)
  3. /api 하위에 tiles, ranking 라우터 마운트
  4. /health 헬스체크 엔드포인트
  5. /docs 에서 Swagger UI 확인 가능
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.tiles import router as tiles_router
from api.ranking import router as ranking_router
from api.users import router as users_router
from database import init_db


# ─── 앱 라이프사이클 관리 ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    서버 시작 시 → DB 테이블 자동 생성 (CREATE IF NOT EXISTS)
    서버 종료 시 → (현재는 별도 정리 작업 없음)
    """
    await init_db()
    yield


# ─── FastAPI 앱 인스턴스 ─────────────────────────────────────
app = FastAPI(
    title="Campus Turf War API",
    description="대학교 진영 지도 점령 게임 백엔드 API",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/api/docs", 
    openapi_url="/api/openapi.json"
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


# ─── 헬스체크 ────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """서버 상태 확인용 엔드포인트"""
    return {"status": "ok", "service": "Campus Turf War API"}
