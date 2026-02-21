# 🥜 땅콩 — 땅을 콩!

> 실제 지도 위 30m × 30m 격자를 점령하며 소속 진영의 영토를 넓혀라!

**땅콩**은 위치 기반 영토 점령 모바일 웹 게임입니다.
대학교, 고향, 직장 등 다양한 소속을 기반으로 지도 위의 타일을 점령하고 전국 순위를 경쟁합니다.

---

## 📸 주요 화면

| 지도 (점령) | 이벤트 (챌린지) | 랭킹 | 로그인 |
|:-----------:|:---------------:|:----:|:------:|
| 카카오맵 위에 대학별 색상 폴리곤 | 진행 중 · 커밍순 챌린지 | 대학교별 점령 순위 | 토스 스타일 인증 퍼널 |

---

## 🏗️ 기술 스택

| 영역 | 기술 |
|------|------|
| **인프라** | Docker Compose, PostgreSQL 15 |
| **백엔드** | Python 3.11+, FastAPI, SQLAlchemy 2.0 (Sync), psycopg2, Pydantic v2, bcrypt |
| **프론트엔드** | React 18 (Vite), JavaScript, Tailwind CSS v4 |
| **상태 관리** | Zustand + persist (클라이언트), TanStack React Query (서버) |
| **지도** | Kakao Maps JavaScript SDK (`react-kakao-maps-sdk`) |
| **UI/UX** | Framer Motion (애니메이션), Axios (HTTP) |

---

## 📁 프로젝트 구조

```
Piro_hack/
├── client/                          # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── BottomNav.jsx        #   플로팅 알약 네비게이션
│   │   │   ├── CaptureMenu.jsx      #   점령 메뉴 UI
│   │   │   ├── MapSearchBar.jsx     #   지도 검색 바
│   │   │   ├── MapView.jsx          #   카카오맵 + 타일 폴리곤 렌더링
│   │   │   ├── TileGameModal.jsx    #   타일 점령 미니게임 모달
│   │   │   ├── TileInfoPanel.jsx    #   타일 정보 바텀 시트
│   │   │   └── Top3Rankingwidget.jsx#   상위 3위 위젯
│   │   ├── games/
│   │   │   ├── BasicRpsGame.jsx     #   가위바위보 게임
│   │   │   ├── BasicTapGame.jsx     #   연타 게임
│   │   │   ├── BasicTimingGame.jsx  #   타이밍 게임
│   │   │   ├── BossClickGame.jsx    #   보스 클릭 게임
│   │   │   └── registry.js          #   게임 레지스트리
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js    #   GPS 위치 추적
│   │   │   ├── useKakaoLoader.js    #   카카오맵 SDK 로더
│   │   │   ├── useKakaoPlaces.js    #   카카오 장소 검색
│   │   │   └── useTiles.js          #   타일 · 랭킹 React Query 훅
│   │   ├── lib/
│   │   │   └── api.js               #   Axios 인스턴스 & API 함수
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         #   토스 스타일 로그인/회원가입
│   │   │   ├── Events.jsx           #   챌린지 허브 페이지
│   │   │   ├── Home.jsx             #   메인 지도 페이지
│   │   │   ├── Profile.jsx          #   프로필 & 로그아웃
│   │   │   └── Ranking.jsx          #   대학교 랭킹 페이지
│   │   ├── store/
│   │   │   └── gameStore.js         #   Zustand 전역 상태 (persist)
│   │   ├── App.jsx                  #   라우팅 설정
│   │   ├── main.jsx                 #   앱 진입점
│   │   └── index.css                #   Tailwind + 글로벌 스타일
│   ├── Dockerfile
│   ├── index.html
│   └── vite.config.js
│
├── server/                          # 백엔드 (FastAPI)
│   ├── api/
│   │   ├── games.py                 #   미니게임 API
│   │   ├── ranking.py               #   대학별 랭킹 API
│   │   ├── tiles.py                 #   타일 조회 · 점령 API
│   │   └── users.py                 #   회원가입 · 로그인 · 이메일 인증
│   ├── core/
│   │   ├── email_verification.py    #   이메일 인증 코드 발송/검증
│   │   ├── game_rules.py            #   게임 규칙 로직
│   │   ├── game_runtime.py          #   게임 실행 런타임
│   │   ├── grid.py                  #   그리드 좌표 계산 유틸리티
│   │   └── special_tiles.py         #   특수 타일 로직
│   ├── config.py                    #   환경 설정 (pydantic-settings)
│   ├── database.py                  #   동기 DB 연결 (SQLAlchemy)
│   ├── models.py                    #   SQLAlchemy 2.0 ORM 모델
│   ├── schemas.py                   #   Pydantic API 스키마
│   ├── main.py                      #   FastAPI 앱 엔트리포인트
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml               # Docker Compose 오케스트레이션
├── .env                             # 루트 환경 변수
├── .gitignore
└── README.md
```

---

## 🎮 핵심 게임 로직

### 그리드 시스템

PostGIS 없이 **단순 수학 연산**으로 지도를 격자로 분할합니다:

| 항목 | 값 | 설명 |
|------|----|------|
| 위도 한 칸 | `0.00027°` | 약 30m |
| 경도 한 칸 | `0.00034°` | 약 30m (한국 기준) |
| Grid ID | `grid_{floor(lat/0.00027)}_{floor(lng/0.00034)}` | 전 세계 동일 격자 |

### 동작 흐름

```
1. GPS로 현재 위치를 받아온다
2. 뷰포트 내 그리드 ID를 계산한다
3. 서버에서 점령 정보를 가져온다
4. 대학교별 색상 폴리곤을 카카오맵 위에 그린다
5. 타일을 탭하면 미니게임 → 점령/방어
```

---

## 🚀 빠른 시작

### 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/) (로컬 프론트 개발 시)
- [Python 3.11+](https://www.python.org/) (로컬 백엔드 개발 시)

### 환경 변수 설정

| 파일 | 주요 변수 |
|------|-----------|
| `.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| `server/.env` | `DATABASE_URL`, `SMTP_*` (이메일 인증) |
| `client/.env` | `VITE_KAKAO_MAP_KEY`, `VITE_API_URL` |

> Gmail SMTP 사용 시 `SMTP_PASSWORD`는 일반 비밀번호가 아닌 **앱 비밀번호**를 입력하세요.

### 방법 1: Docker Compose (권장)

```bash
# 프로젝트 클론
git clone <레포지토리-URL>
cd Piro_hack

# 전체 서비스 시작
docker compose up --build

# 접속
#   프론트엔드  → http://localhost:5173
#   백엔드 API → http://localhost:8000
#   API 문서   → http://localhost:8000/api/docs
```

### 방법 2: 로컬 개별 실행

**터미널 1 — DB**
```bash
docker compose up postgres
```

**터미널 2 — 백엔드**
```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
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

## 🗺️ 카카오맵 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 앱 등록
2. **JavaScript 키** 복사 → `client/.env`에 `VITE_KAKAO_MAP_KEY=발급받은키` 입력
3. 플랫폼 → **Web** → `http://localhost:5173` 등록

---

## 📡 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 서버 상태 확인 |
| **타일** | | |
| `GET` | `/api/tiles` | 전체 점령 타일 조회 |
| `POST` | `/api/occupy` | 타일 점령 요청 |
| **랭킹** | | |
| `GET` | `/api/ranking` | 대학별 점령 순위 Top 10 |
| **인증** | | |
| `POST` | `/api/send-code` | 학교 이메일 인증 코드 발송 |
| `POST` | `/api/verify-code` | 인증 코드 확인 |
| `POST` | `/api/signup` | 회원가입 (이메일 + 닉네임 + 비밀번호) |
| `POST` | `/api/login` | 로그인 (이메일 + 비밀번호) |

---

## 🛠️ 개발 가이드

### 코드 컨벤션

- **주석**: 모든 코드 주석은 **한국어**
- **네이밍**: 영어 (JS: camelCase, Python: snake_case)
- **프론트엔드**: `.jsx` / `.js` 파일만 사용 (No TypeScript)
- **상태 관리**: 클라이언트 → Zustand, 서버 → React Query

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

- [x] 모노레포 스캐폴딩 & Docker Compose
- [x] 그리드 계산 로직 & 타일 API
- [x] 카카오맵 타일 폴리곤 렌더링
- [x] SQLAlchemy 2.0 DB 연동 (Territory, Organization 등)
- [x] 학교 이메일 인증 & 회원가입/로그인
- [x] Zustand persist 자동 로그인
- [x] 토스 스타일 인증 페이지 (Full-screen Funnel)
- [x] 이벤트(챌린지) 페이지
- [x] 미니게임 시스템 (가위바위보, 연타, 타이밍, 보스)
- [ ] 프라이빗 챌린지 방
- [ ] 실시간 점령 알림 (WebSocket)
- [ ] PWA 설정 (오프라인, 푸시 알림)
- [ ] 다양한 소속 챌린지 (고향, 직장, 동아리)

---

## 👥 팀

| 역할 | 담당 |
|------|------|
| 프론트엔드 | TBD |
| 백엔드 | TBD |
| 풀스택 | TBD |
| 프론트엔드 | TBD |
| 백엔드 | TBD |
