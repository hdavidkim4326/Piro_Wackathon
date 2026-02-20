# ============================================================
# Campus Turf War - 백엔드 Dockerfile
# Python 3.11 기반 FastAPI 서버
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치 (asyncpg 빌드에 필요)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# uvicorn 개발 서버 실행 (핫 리로드 활성화)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
