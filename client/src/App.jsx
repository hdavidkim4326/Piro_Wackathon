/**
 * 앱 루트 컴포넌트
 * ────────────────
 * React Router로 페이지 라우팅을 설정하고,
 * 공통 레이아웃(배경, 플로팅 네비게이션)을 렌더링한다.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

/**
 * 앱 최상위 컴포넌트.
 * 라이트 모드 배경 + 전체 높이 레이아웃.
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-full bg-slate-50 overflow-hidden relative">
        {/* 페이지 라우팅 — 전체 화면 */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>

        {/* 플로팅 알약 네비게이션 */}
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
