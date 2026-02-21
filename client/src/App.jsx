/**
 * 앱 루트 컴포넌트
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Events from './pages/Events'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import AuthPage from './pages/AuthPage'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div
        className="w-full max-w-[430px] h-screen bg-slate-50 overflow-hidden relative shadow-2xl"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </div>
    </div>
  )
}
