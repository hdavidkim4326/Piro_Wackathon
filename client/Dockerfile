# ============================================================
# Campus Turf War - 프론트엔드 Dockerfile
# Node 20 기반 Vite 개발 서버
# ============================================================

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Vite 개발 서버 실행 (컨테이너 외부 접근 허용)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
