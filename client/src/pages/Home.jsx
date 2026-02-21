/**
 * 홈(지도) 페이지 — 플로팅 HUD 레이아웃 (병합 완료)
 * ──────────────────────────────────────────────────
 * [팀원] MapView가 전체 화면(absolute inset-0)으로 깔림
 * [내 디자인] 글래스모피즘 HUD가 z-30~z-60 레이어로 둥둥 떠 있음
 *
 * [레이어 구조]
 *   z-0   MapView (카카오맵 + 그리드 폴리곤)
 *   z-20  타일 카운터 뱃지 (MapView 내부)
 *   z-30  상단 플로팅 정보 바, GPS 버튼
 *   z-55  TileInfoPanel 딤드 오버레이
 *   z-60  TileInfoPanel 바텀 시트, BottomNav
 */

import { motion } from 'framer-motion'

import { useGeolocation } from '../hooks/useGeolocation'
import { useTiles, useRanking } from '../hooks/useTiles'
import useGameStore from '../store/gameStore'
import MapView from '../components/MapView'
import TileInfoPanel from '../components/TileInfoPanel'

// ─── GPS 미수신 시 기본 위치: 서울 시청 ─────────────────────
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/**
 * 홈 페이지 컴포넌트.
 * 전체 화면 지도 + 플로팅 HUD 오버레이.
 */
export default function Home() {
  const { location, error, loading } = useGeolocation()
  const user = useGameStore((s) => s.user)
  const { data: tiles, isLoading: tilesLoading } = useTiles()
  const { data: ranking } = useRanking(1)

  const center = location || DEFAULT_CENTER
  const topUniv = ranking?.[0]

  /** GPS 버튼 → 현재 위치로 지도 센터 강제 갱신 */
  const handleGpsClick = () => {
    if (location) {
      useGameStore.getState().setLocation({ ...location })
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">

      {/* ━━━ z-0: 전체 화면 지도 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <MapView center={center} />

      {/* ━━━ z-30: 상단 플로팅 정보 바 ━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.1 }}
        className="absolute top-5 left-4 right-4 z-30 bg-white/90 backdrop-blur-xl rounded-2xl px-5 py-3.5 shadow-lg shadow-slate-900/5 border border-white/60"
      >
        <div className="flex items-center justify-between">
          {/* 왼쪽: 내 정보 */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                user
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {user ? user.nickname.charAt(0).toUpperCase() : '?'}
              </div>
              {/* GPS 연결 인디케이터 */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-800 tracking-tight truncate">
                {user?.nickname || 'Campus Turf War'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {user?.university || (loading ? '위치 수신 중...' : 'GPS 연결됨')}
              </p>
            </div>
          </div>

          {/* 오른쪽: 현재 1위 대학 */}
          {topUniv && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-1.5 flex-shrink-0"
            >
              <span className="text-sm">👑</span>
              <div className="text-right">
                <p className="text-xs font-bold text-amber-700 leading-tight">
                  {topUniv.university}
                </p>
                <p className="text-[10px] text-amber-500 font-semibold">
                  {topUniv.tile_count}칸 점령
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* ━━━ z-20: 타일 로딩 인디케이터 ━━━━━━━━━━━━━━━━━━━━━━ */}
      {tilesLoading && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md text-xs font-semibold text-slate-500"
        >
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
            타일 로딩 중...
          </span>
        </motion.div>
      )}

      {/* ━━━ z-30: 우하단 GPS 복귀 버튼 ━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.4 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleGpsClick}
        className="absolute bottom-28 right-5 z-30 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-slate-900/10 border border-white/60 flex items-center justify-center active:bg-slate-50 transition-colors"
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
          className="w-5 h-5 text-indigo-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </motion.button>

      {/* ━━━ z-55~60: 타일 정보 바텀 시트 ━━━━━━━━━━━━━━━━━━━ */}
      <TileInfoPanel />
    </div>
  )
}
