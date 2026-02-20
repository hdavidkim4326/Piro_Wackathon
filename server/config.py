"""
서버 설정 모듈
─────────────
pydantic-settings를 사용해 환경 변수에서 설정값을 읽어온다.
docker-compose.yml이나 .env 파일에서 DATABASE_URL 등을 주입받는다.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """앱 전체에서 사용하는 설정 클래스"""

    # PostgreSQL 비동기 연결 URL (asyncpg 드라이버 사용)
    DATABASE_URL: str = (
        "postgresql+asyncpg://campusturf:campusturf1234@localhost:5432/campusturf_db"
    )

    # CORS에서 허용할 프론트엔드 오리진 목록
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


# 싱글턴 인스턴스 — 다른 모듈에서 import해서 사용
settings = Settings()
