/**
 * 앱 루트 컴포넌트
 * ────────────────
 * React Router로 페이지 라우팅을 설정하고,
 * 모든 페이지에 공통으로 들어가는 하단 네비게이션 바를 렌더링한다.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

/**
 * 앱의 최상위 컴포넌트.
 * BrowserRouter 안에 페이지 라우팅과 전역 UI(BottomNav)를 배치한다.
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-surface">
        {/* 페이지 라우팅 — flex-1로 남은 공간을 모두 차지 */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>

        {/* 모든 페이지에 공통으로 표시되는 하단 네비게이션 */}
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
