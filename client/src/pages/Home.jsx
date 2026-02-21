// src/pages/Home.jsx
import { useMemo, useState, useEffect } from "react"; // ✅ useEffect 추가
import { motion } from "framer-motion";
import MapView from "../components/MapView";
import TileInfoPanel from "../components/TileInfoPanel";
import { useGeolocation } from "../hooks/useGeolocation";
import useGameStore from "../store/gameStore";
import MapSearchBar from "../components/MapSearchBar";
import CaptureMenu from "../components/CaptureMenu";
import Top3RankingWidget from "../components/Top3Rankingwidget"; 



const LAT_STEP = 0.00027;
const LNG_STEP = 0.00034;

function calcGridIdFromLatLng(lat, lng) {
  const row = Math.floor(lat / LAT_STEP);
  const col = Math.floor(lng / LNG_STEP);
  return `grid_${row}_${col}`;
}

export default function Home() {
  const user = useGameStore((s) => s.user);
  const location = useGameStore((s) => s.location);
  const setLocation = useGameStore((s) => s.setLocation);

  const { loading, error } = useGeolocation();

  const [captureMenuOpen, setCaptureMenuOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);

  const center = location || { lat: 37.5665, lng: 126.978 };

  // ✅ GPS 중심과 별개로 "지도 중심" 상태
  const [mapCenter, setMapCenter] = useState(center);

  // ✅ GPS 갱신되면 지도 중심도 따라가게
  useEffect(() => {
    if (location) setMapCenter(location);
  }, [location]);

  const currentGridId = useMemo(() => {
    if (!location) return null;
    return calcGridIdFromLatLng(location.lat, location.lng);
  }, [location]);

  const handleGpsClick = () => {
    if (location) setMapCenter(location); // ✅ 버튼 누르면 지도 중심을 내 위치로 이동
    if (location) setLocation({ ...location }); // 기존 로직 유지(필요하면)
  };

  const openCaptureMenu = () => setCaptureMenuOpen(true);

  const handlePickQuickCapture = () => {
    setCaptureMenuOpen(false);
    setHoldOpen(true);
  };

  const handlePickChallengeCapture = () => {
    setCaptureMenuOpen(false);
    alert("도전 점령은 다음 단계에서 붙이면 돼. 지금은 빠른 점령만 구현했어.");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      {/* ✅ 지도: mapCenter로 */}
      <MapView center={mapCenter} />

      {/* 상단: 검색 + 상태바 */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col gap-3">
        {/* ✅ 검색 결과 클릭하면 지도 중심 이동 */}
        <MapSearchBar
          onPickPlace={(p) => {
            setMapCenter({ lat: p.lat, lng: p.lng });
          }}
        />

        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg shadow-slate-900/5 border border-white/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-800 tracking-tight truncate">
                {user?.nickname || "Campus Turf War"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {user?.university ||
                  (loading ? "위치 수신 중..." : error ? "GPS 오류" : "GPS 연결됨")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  loading
                    ? "bg-amber-400 animate-pulse"
                    : error
                    ? "bg-red-400"
                    : "bg-emerald-400"
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-500">
                {currentGridId ? currentGridId : "grid 계산 대기"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <Top3RankingWidget />
      

      <motion.button
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260, delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={openCaptureMenu}
        className="absolute left-1/2 -translate-x-1/2 bottom-28 z-30 bg-indigo-600 text-white font-extrabold rounded-2xl px-7 py-4 shadow-xl shadow-indigo-600/25 active:bg-indigo-700"
      >
        점령하기
      </motion.button>

      <motion.button
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.25 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleGpsClick}
        className="absolute bottom-28 right-5 z-30 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-white/60 flex items-center justify-center active:bg-slate-50 transition-colors"
        aria-label="내 위치로 이동"
      >
        {/* 아이콘 그대로 */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
          className="w-5 h-5 text-indigo-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </motion.button>

      <CaptureMenu
        open={captureMenuOpen}
        onClose={() => setCaptureMenuOpen(false)}
        onQuick={handlePickQuickCapture}
        onChallenge={handlePickChallengeCapture}
      />

      <TileInfoPanel />
    </div>
  );
}