/**
 * 앱 루트 컴포넌트
 * ────────────────
 * /auth 라우트로 전체 화면 인증 페이지를 제공한다.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import AuthPage from './pages/AuthPage'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-full bg-slate-50 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
