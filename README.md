# 대학교 진영 지도 점령 게임

> 실제 지도 위에서 30m × 30m 그리드를 점령하며 우리 대학교의 영토를 넓혀라!

대학생들이 실제 위치 기반으로 지도 위의 타일(그리드)을 점령하며 경쟁하는 모바일 웹 게임(PWA)입니다.

---

## 📸 프로젝트 미리보기

| 지도 화면 | 랭킹 화면 | 프로필 화면 |
|:---------:|:---------:|:-----------:|
| 카카오맵 위에 점령 타일 표시 | 대학교별 점령 순위 | 닉네임·소속 대학 설정 |

---

## 🏗️ 기술 스택

| 영역 | 기술 |
|------|------|
| **인프라** | Docker Compose, PostgreSQL 15 |
| **백엔드** | Python 3.11+, FastAPI, SQLModel (Async), asyncpg |
| **프론트엔드** | React (Vite), JavaScript, Tailwind CSS v4 |
| **상태 관리** | Zustand (클라이언트), TanStack React Query (서버) |
| **지도** | Kakao Maps SDK (`react-kakao-maps-sdk`) |
| **기타** | Framer Motion (애니메이션), Axios (HTTP 통신) |

---

## 📁 프로젝트 구조

```
Piro_hack/
├── client/                     # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── components/         # 재사용 컴포넌트
│   │   │   ├── BottomNav.jsx   #   하단 네비게이션 바
│   │   │   ├── MapView.jsx     #   카카오맵 + 타일 렌더링
│   │   │   └── TileInfoPanel.jsx#  타일 정보 팝업 패널
│   │   ├── hooks/              # 커스텀 훅
│   │   │   ├── useGeolocation.js#  GPS 위치 추적
│   │   │   └── useTiles.js     #   타일 데이터 (React Query)
│   │   ├── lib/
│   │   │   └── api.js          # Axios 인스턴스 & API 함수
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── Home.jsx        #   메인 지도 페이지
│   │   │   ├── Ranking.jsx     #   대학교 랭킹 페이지
│   │   │   └── Profile.jsx     #   프로필 설정 페이지
│   │   ├── store/
│   │   │   └── gameStore.js    # Zustand 전역 상태
│   │   ├── App.jsx             # 라우팅 설정
│   │   ├── main.jsx            # 앱 진입점
│   │   └── index.css           # Tailwind + 글로벌 스타일
│   ├── Dockerfile
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # 백엔드 (FastAPI)
│   ├── api/
│   │   └── tiles.py            # 타일 API 라우터
│   ├── core/
│   │   └── grid.py             # 그리드 좌표 계산 유틸리티
│   ├── config.py               # 환경 설정 (pydantic-settings)
│   ├── database.py             # 비동기 DB 연결 설정
│   ├── models.py               # SQLModel 테이블 정의
│   ├── main.py                 # FastAPI 앱 엔트리포인트
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml          # Docker Compose 오케스트레이션
├── .env                        # 환경 변수 (git에 포함하지 않음)
├── .gitignore
└── README.md
```

---

## 🎮 핵심 게임 로직

### 그리드 시스템

PostGIS 같은 GIS 라이브러리 없이 **단순 수학 연산**으로 지도를 격자로 나눕니다:

| 항목 | 값 | 설명 |
|------|----|------|
| 위도 한 칸 | `0.00027°` | 약 30m (위도 1° ≈ 111km) |
| 경도 한 칸 | `0.00034°` | 약 30m (한국 위도 기준, 경도 1° ≈ 88km) |
| Grid ID 공식 | `grid_{floor(lat/0.00027)}_{floor(lng/0.00034)}` | 전 세계 어디든 동일한 그리드 |

### 동작 흐름

```
1. 사용자가 앱을 열면 GPS로 현재 위치를 받아온다
2. 지도 뷰포트 내의 그리드 ID들을 계산한다
3. 서버에서 해당 그리드들의 점령 정보를 가져온다
4. 카카오맵 위에 대학교별 색상으로 폴리곤을 그린다
5. 사용자가 타일을 탭하면 점령/정보 확인이 가능하다
```

---

## 🚀 빠른 시작 (Quick Start)

### 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- [Node.js 20+](https://nodejs.org/) (로컬 프론트엔드 개발 시)
- [Python 3.11+](https://www.python.org/) (로컬 백엔드 개발 시)

### 학교 이메일 인증 SMTP 설정

- 루트 `.env`의 `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER`를 실제 계정값으로 설정
- Gmail 사용 시 `SMTP_PASSWORD`는 일반 비밀번호가 아닌 **앱 비밀번호** 사용
- `EMAIL_VERIFICATION_DEV_MODE=false`여야 실제 메일 발송

### 방법 1: Docker Compose로 한번에 실행 (권장)

```bash
# 1. 프로젝트 클론
git clone <레포지토리-URL>
cd Piro_hack

# 2. 환경 변수 파일 확인 (이미 .env 파일이 있음)
cat .env

# 3. Docker Compose로 전체 서비스 시작
docker compose up --build

# 4. 브라우저에서 접속
#    프론트엔드: http://localhost:5173
#    백엔드 API: http://localhost:8000
#    API 문서:   http://localhost:8000/docs
```

### 방법 2: 로컬에서 개별 실행

**터미널 1 — PostgreSQL (Docker)**
```bash
docker compose up postgres
```

**터미널 2 — 백엔드**
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**터미널 3 — 프론트엔드**
```bash
cd client
npm install
npm run dev
```

---

## 🗺️ 카카오맵 SDK 설정

카카오맵을 사용하려면 [Kakao Developers](https://developers.kakao.com/)에서 앱을 등록하고 JavaScript 키를 발급받아야 합니다.

1. [Kakao Developers](https://developers.kakao.com/)에 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. **앱 키** → **JavaScript 키** 복사
4. `client/index.html`의 `<head>`에 다음 스크립트 추가:

```html
<script
  type="text/javascript"
  src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&autoload=false"
></script>
```

> **참고**: 카카오맵 키 없이도 앱은 동작합니다. 지도 대신 플레이스홀더 UI가 표시되며, GPS 위치와 타일 데이터는 정상적으로 수신됩니다.

---

## 📡 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/api/tiles?min_lat=...&max_lat=...&min_lng=...&max_lng=...` | 뷰포트 내 타일 목록 조회 |
| `POST` | `/api/occupy` | 타일 점령 요청 |

### 요청/응답 예시

**타일 조회**
```bash
curl "http://localhost:8000/api/tiles?min_lat=37.56&max_lat=37.57&min_lng=126.97&max_lng=126.98"
```

**타일 점령**
```bash
curl -X POST http://localhost:8000/api/occupy \
  -H "Content-Type: application/json" \
  -d '{"grid_id": "grid_139131_373471", "university": "서울대학교"}'
```

---

## 🛠️ 개발 가이드

### 코드 컨벤션

- **주석 언어**: 모든 코드 주석과 JSDoc은 **한국어**로 작성
- **변수·함수명**: 영어 사용 (camelCase for JS, snake_case for Python)
- **프론트엔드**: `.jsx`, `.js` 파일만 사용 (TypeScript 사용 금지)
- **상태 관리 원칙**:
  - 클라이언트 상태 (사용자 정보, 위치, UI) → **Zustand**
  - 서버 상태 (타일 데이터, 랭킹) → **React Query**

### 주요 명령어

```bash
# 프론트엔드 개발 서버
cd client && npm run dev

# 프론트엔드 빌드
cd client && npm run build

# 백엔드 개발 서버
cd server && uvicorn main:app --reload

# Docker 전체 실행
docker compose up --build

# Docker 종료 & 볼륨 삭제
docker compose down -v
```

---

## 🗓️ 로드맵

- [x] 프로젝트 스캐폴딩 (모노레포 구조)
- [x] Docker Compose 설정
- [x] 그리드 계산 로직 구현
- [x] FastAPI 타일 API (더미 데이터)
- [x] React 프론트엔드 기본 UI
- [ ] 카카오맵 타일 폴리곤 렌더링
- [ ] DB 연동 (Tile CRUD)
- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 실시간 점령 알림 (WebSocket)
- [ ] PWA 설정 (오프라인, 푸시 알림)
- [ ] 대학교별 통계 대시보드

---

## 👥 팀

| 역할 | 담당 |
|------|------|
| 프론트엔드1 | TBD |
| 백엔드1 | TBD |
| 풀스텍 | TBD |
| 프론트엔드2 | TBD |
| 백엔드2 | TBD |
