/**
 * 앱 루트 컴포넌트
 * ────────────────
 * /auth 라우트로 전체 화면 인증 페이지를 제공한다.
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";

import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import AuthPage from './pages/AuthPage'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    // 1. PC 화면에서 배경을 덮고 모바일 화면을 가운데로 정렬 (bg-slate-200)
    <div className="min-h-screen bg-slate-200 flex justify-center">
      
      {/* 2. 실제 스마트폰 크기의 컨테이너 (최대 너비 430px, 그림자 추가로 앱처럼 보이게) */}
      <div
        className="w-full max-w-[430px] h-screen bg-slate-50 overflow-hidden relative shadow-2xl"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
        }}
      >
        <BrowserRouter>
          {/* 페이지 라우팅 — 전체 화면 */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* 🔥 방금 만든 토스 스타일 로그인/회원가입 전체 화면 라우트 추가! */}
            <Route path="/auth" element={<AuthPage />} />
          </Routes>

          {/* 플로팅 알약 네비게이션 (BottomNav 내부 로직에서 /auth일 때는 알아서 숨겨질 겁니다) */}
          <BottomNav />
        </BrowserRouter>
      </div>
    </div>
  );
}