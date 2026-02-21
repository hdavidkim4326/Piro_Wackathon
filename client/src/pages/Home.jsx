import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import MapView from "../components/MapView";
import TileInfoPanel from "../components/TileInfoPanel";
import { useGeolocation } from "../hooks/useGeolocation";
import useGameStore from "../store/gameStore";
import MapSearchBar from "../components/MapSearchBar";
import CaptureMenu from "../components/CaptureMenu";
import Top3RankingWidget from "../components/Top3Rankingwidget";

const MotionDiv = motion.div;
const MotionButton = motion.button;

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
  const [mapCenter, setMapCenter] = useState(null);

  const center = mapCenter || location || { lat: 37.5665, lng: 126.978 };

  const currentGridId = useMemo(() => {
    if (!location) return null;
    return calcGridIdFromLatLng(location.lat, location.lng);
  }, [location]);

  const handleGpsClick = () => {
    if (location) {
      setMapCenter(location);
      setLocation({ ...location });
    }
  };

  const handlePickQuickCapture = () => {
    setCaptureMenuOpen(false);
    alert("빠른 점령은 준비 중입니다.");
  };

  const handlePickChallengeCapture = () => {
    setCaptureMenuOpen(false);
    alert("챌린지 점령은 다음 단계에서 연결할 예정입니다.");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      <MapView center={center} />

      <div className="absolute left-4 right-4 top-4 z-30 flex flex-col gap-3">
        <MapSearchBar
          onPickPlace={(p) => {
            setMapCenter({ lat: p.lat, lng: p.lng });
          }}
        />

        <MotionDiv
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-slate-800">
                {user?.nickname || "Campus Turf War"}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-400">
                {user?.university ||
                  (loading ? "위치 수신 중..." : error ? "GPS 오류" : "GPS 연결됨")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  loading
                    ? "animate-pulse bg-amber-400"
                    : error
                      ? "bg-red-400"
                      : "bg-emerald-400"
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-500">
                {currentGridId || "grid 계산 대기"}
              </span>
            </div>
          </div>
        </MotionDiv>
      </div>

      <Top3RankingWidget />

      <MotionButton
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 260, delay: 0.15 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setCaptureMenuOpen(true)}
        className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-2xl bg-indigo-600 px-7 py-4 font-extrabold text-white shadow-xl shadow-indigo-600/25 active:bg-indigo-700"
      >
        점령하기
      </MotionButton>

      <MotionButton
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.25 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleGpsClick}
        className="absolute bottom-28 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-lg backdrop-blur-xl transition-colors active:bg-slate-50"
        aria-label="내 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-indigo-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </MotionButton>

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
