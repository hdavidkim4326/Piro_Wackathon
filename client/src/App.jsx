import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div
        className="w-full max-w-[430px] h-screen bg-slate-50 overflow-hidden relative"
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
          </Routes>

          {/* 플로팅 알약 네비게이션 */}
          <BottomNav />
        </BrowserRouter>
      </div>
    </div>
  );
}