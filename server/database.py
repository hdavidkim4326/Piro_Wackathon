# database.py
from __future__ import annotations

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# .env 로드 (로컬 개발용)
# - docker-compose/.env 쓰는 구조면 이거 켜두는 게 편함
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env or environment variables.")

# Engine
# pool_pre_ping=True: 죽은 커넥션을 자동으로 감지/복구(로컬/도커에서 유용)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

# FastAPI Dependency Injection (요청당 세션 1개)
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()