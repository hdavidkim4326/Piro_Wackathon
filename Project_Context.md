# 🗺️ Project: Campus Turf War (캠퍼스 영토 전쟁)

## 1. Project Overview (프로젝트 비전)
- **목적:** 위치 기반(Kakao Maps API) 실시간 땅따먹기 멀티플레이 플랫폼.
- **확장성:** MVP는 '전국 대학교 대전'이지만, 향후 '고향 대전', '직장인 대전', '프라이빗 방 만들기' 등 다양한 소속 기반의 챌린지로 확장되는 하이엔드 서비스.
- **핵심 목표:** 토스(Toss) 및 Apple App Store 수준의 완벽한 UI/UX, 다수 유저의 동시 접속을 버티는 실시간 동시성 처리,

## 2. Tech Stack (기술 스택)
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion (애니메이션), Zustand (상태 관리 - `persist`로 로컬 스토리지 연동), Kakao Maps API.
- **Backend:** FastAPI (Python), SQLAlchemy (Sync 방식), Pydantic (데이터 검증), Passlib/Bcrypt (비밀번호 암호화).
- **Database:** PostgreSQL (AWS EC2 환경에 배포됨, `users`, `user_organization` 등의 테이블 구조).
- **Infrastructure:** Docker Compose (현재 프론트엔드와 백엔드 컨테이너만 로컬에서 띄우고, DB는 AWS 원격 DB를 바라보는 클라이언트 모드로 동작).

## 3. Design System & UI/UX Rules (절대 규칙)
- **Toss Style UI:** 모든 UI는 '토스'나 '애플' 스타일의 하이엔드 모바일 앱 감성을 따른다.
- **Layout:** 반응형을 위해 PC에서도 모바일 앱처럼 보이도록 최상위를 `max-w-[430px]` 컨테이너로 묶고 중앙 정렬한다.
- **Spacing & Alignment:** 절대 깨지지 않는 레이아웃을 위해 억지 `margin` 대신 `flex flex-col`과 `gap`을 적극 활용한다.
- **Styling:** 모서리는 둥글게(`rounded-2xl` ~ `rounded-3xl`), 그림자는 부드럽게(`shadow-sm`, 커스텀 `rgba` 섀도우), 텍스트는 굵고 선명하게(`font-extrabold`, `tracking-tight`) 처리한다.

## 4. Current Progress (현재까지 구현 완료된 사항)
- **인프라:** 로컬 개발 환경에서 AWS 원격 PostgreSQL DB 연동 성공.
- **프론트엔드 UI:** 1. `App.jsx` 모바일 뷰포트 레이아웃 완성.
  2. `AuthPage.jsx`: 토스 스타일의 전체 화면(Full-page) 퍼널 회원가입/로그인 완료.
  3. `Events.jsx`: Apple App Store 스타일의 챌린지 허브 페이지(가로 스크롤 카드 등) 퍼펙트 픽셀 구현 완료.
  4. 지도 렌더링: 카카오맵 연동, 내 위치 갱신 시 부드러운 이동(`panTo`) 및 GPS 덜덜거림 방지 로직 적용. 대학별 Hex 색상 타일 렌더링.
- **백엔드 API:** 이메일 인증, 비밀번호 설정, 회원가입, 로그인 API 연동 완료 (`api/users.py`).

## 5. Next Action Items (앞으로 네가 구현해야 할 최우선 과제)
1. **API 인증 헤더 연동:** 유저가 지도에서 땅을 점령(`POST /api/occupy`)할 때, 프론트엔드에서 유저 정보(ID 또는 JWT)를 헤더에 실어 백엔드로 보내어 '누가 점령했는지' DB에 기록되게 만들기.
2. **마이페이지(Profile) 데이터 연동:** `GET /api/users/me/stats`를 생성하여 내가 점령한 땅 개수, 기여도 등을 UI에 뿌려주기.
3. **게임 성공시 그리드 인증하고 색깔 보이게하기 (Killer Feature):** 게임 성공해도 DB랑 연결이 전혀 안됨. 이걸 더 확인하고 개발해야함 
4. **동시성 제어 & WebSocket:** 여러 명이 동시에 같은 땅을 누를 때 랭킹이 꼬이지 않도록 DB Lock 구현 및 보스전을 위한 실시간 WebSocket 연동.

## 6. AI Assistant Guidelines (너를 위한 지침)
- 기존 코드를 무너뜨리지 않는 선에서, 최적화(Clean Code)된 부분만 변경해라.
- 프론트엔드 작업 시, Tailwind 클래스가 충돌하거나 레이아웃이 찢어지지 않는지 한 번 더 검증하고 출력해라.
- 기본 디자인은 모바일 뷰가 가장 잘보이는게 최우선이다. 노트북은 꺠지지만 않으면 됨