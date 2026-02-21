/**
 * 타일 정보 바텀 시트 컴포넌트
 * ──────────────────────────
 * 토스 앱 스타일의 바텀 시트.
 * 사용자가 지도에서 타일을 탭하면 하단에서 스프링 애니메이션으로 올라온다.
 * 글래스모피즘 배경 위에 대학교 뱃지, 레벨, 점령 버튼을 배치한다.
 */

import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useOccupyTile } from '../hooks/useTiles'

// ─── 대학교별 그라데이션·글로우 매핑 ────────────────────────
const UNIV_STYLES = {
  서울대학교: {
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-[0_0_24px_rgba(59,130,246,0.45)]',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    emoji: '🔵',
  },
  연세대학교: {
    gradient: 'from-sky-400 to-blue-600',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.45)]',
    badge: 'bg-sky-50 text-sky-600 border-sky-200',
    emoji: '🦅',
  },
  고려대학교: {
    gradient: 'from-red-500 to-rose-600',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.45)]',
    badge: 'bg-red-50 text-red-600 border-red-200',
    emoji: '🐯',
  },
}

const DEFAULT_STYLE = {
  gradient: 'from-indigo-500 to-purple-600',
  glow: 'shadow-[0_0_24px_rgba(99,102,241,0.4)]',
  badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  emoji: '⚡',
}

/**
 * 대학교 이름에 맞는 스타일 객체를 반환한다.
 * @param {string|null} univ
 */
function getStyle(univ) {
  if (!univ) return DEFAULT_STYLE
  return UNIV_STYLES[univ] || DEFAULT_STYLE
}

/**
 * 토스 스타일 바텀 시트 — 선택된 타일의 정보와 점령 액션을 제공한다.
 */
export default function TileInfoPanel() {
  const selectedTile = useGameStore((s) => s.selectedTile)
  const setSelectedTile = useGameStore((s) => s.setSelectedTile)
  const user = useGameStore((s) => s.user)
  const { mutate: occupy, isPending } = useOccupyTile()

  /** 점령 버튼 클릭 → 소속 대학교로 해당 타일을 점령 요청 */
  const handleOccupy = () => {
    if (!selectedTile) return
    const university = user?.university || '우리대학교'
    occupy(
      { gridId: selectedTile.grid_id, university },
      { onSuccess: () => setSelectedTile(null) }
    )
  }

  const style = getStyle(selectedTile?.owner_univ)
  const isOwned = !!selectedTile?.owner_univ

  return (
    <AnimatePresence>
      {selectedTile && (
        <>
          {/* 딤드 오버레이 — 탭하면 시트 닫기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedTile(null)}
            className="fixed inset-0 z-[55] bg-black/20"
          />

          {/* 바텀 시트 본체 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-2xl rounded-t-[2.5rem] px-6 pt-5 pb-10 shadow-[0_-10px_60px_rgba(0,0,0,0.12)]"
          >
            {/* 핸들 바 */}
            <div className="w-10 h-[5px] bg-slate-200 rounded-full mx-auto mb-5" />

            {/* 소속 대학 뱃지 + 상태 */}
            <div className="flex items-center gap-3 mb-5">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="text-3xl"
              >
                {isOwned ? style.emoji : '🏳️'}
              </motion.span>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-800">
                  {isOwned
                    ? `${selectedTile.owner_univ} 점령중`
                    : '빈 땅 발견!'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {selectedTile.grid_id}
                </p>
              </div>
            </div>

            {/* 레벨 표시 영역 */}
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 mb-5">
              <span className="text-sm font-semibold text-slate-500">
                점령 레벨
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-slate-800">
                  {selectedTile.level || 0}
                </span>
                <span className="text-sm font-bold text-slate-400">LV</span>
              </div>
            </div>

            {/* 점령 버튼 — 토스 송금 버튼처럼 크고 시원하게 */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOccupy}
              disabled={isPending}
              className={`
                w-full rounded-2xl py-5 text-xl font-bold text-white
                bg-gradient-to-r ${style.gradient} ${style.glow}
                disabled:opacity-50 disabled:shadow-none
                active:brightness-95 transition-all duration-150
              `}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  점령 중...
                </span>
              ) : isOwned ? (
                '이 타일 빼앗기'
              ) : (
                '이 타일 점령하기'
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
