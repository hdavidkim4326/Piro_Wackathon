"""
Campus Turf War — FastAPI 메인 엔트리포인트
──────────────────────────────────────────
앱 인스턴스를 생성하고, CORS 미들웨어를 설정하고,
라우터를 등록하고, 서버 시작 시 DB 테이블을 초기화한다.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.tiles import router as tiles_router
from database import init_db


# ─── 앱 라이프사이클 관리 ────────────────────────────────────
# FastAPI 서버가 시작될 때 DB 테이블을 자동 생성한다.
@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 시 실행되는 라이프사이클 핸들러"""
    await init_db()
    yield


# ─── FastAPI 앱 인스턴스 ─────────────────────────────────────
app = FastAPI(
    title="Campus Turf War API",
    description="대학교 진영 지도 점령 게임 백엔드 API",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS 미들웨어 설정 ──────────────────────────────────────
# 개발 단계에서는 모든 오리진을 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 라우터 등록 ─────────────────────────────────────────────
# /api 프리픽스 아래에 타일 관련 엔드포인트를 묶는다.
app.include_router(tiles_router, prefix="/api", tags=["tiles"])


# ─── 헬스체크 엔드포인트 ─────────────────────────────────────
@app.get("/health")
async def health_check():
    """서버 상태 확인용 엔드포인트"""
    return {"status": "ok", "service": "Campus Turf War API"}
