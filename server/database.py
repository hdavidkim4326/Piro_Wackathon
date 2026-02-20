"""
데이터베이스 연결 모듈
─────────────────────
SQLModel + asyncpg 기반 비동기 PostgreSQL 연결을 설정한다.
FastAPI의 Depends()를 통해 라우터에서 세션을 주입받아 사용한다.
"""

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import settings

# ─── 비동기 엔진 생성 ────────────────────────────────────────
# echo=True로 설정하면 실행되는 SQL 쿼리가 콘솔에 출력된다 (개발용)
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    future=True,
)

# ─── 비동기 세션 팩토리 ──────────────────────────────────────
# expire_on_commit=False → 커밋 후에도 객체 속성에 접근 가능
async_session_maker = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """
    서버 시작 시 호출되어 테이블을 자동 생성한다.
    개발 단계에서만 사용하고, 프로덕션에서는 Alembic 마이그레이션을 쓴다.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    """
    FastAPI Depends()용 비동기 세션 제너레이터.
    요청이 끝나면 세션을 자동으로 닫아준다.
    """
    async with async_session_maker() as session:
        yield session
