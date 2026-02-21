/**
 * 랭킹 페이지 — 토스 스타일 라이트 테마
 * ─────────────────────────────────────
 * 대학교별 점령 현황 순위를 카드 리스트로 보여준다.
 * GET /api/ranking 에서 실시간 데이터를 가져온다.
 */

import { motion } from 'framer-motion'
import { useRanking } from '../hooks/useTiles'

// ─── 순위별 그라데이션·스타일 매핑 ──────────────────────────
const RANK_STYLES = [
  { gradient: 'from-amber-400 to-orange-500', text: 'text-amber-700', bg: 'bg-amber-50', emoji: '🥇' },
  { gradient: 'from-slate-300 to-slate-400', text: 'text-slate-600', bg: 'bg-slate-50', emoji: '🥈' },
  { gradient: 'from-amber-600 to-amber-700', text: 'text-amber-800', bg: 'bg-orange-50', emoji: '🥉' },
]

/**
 * 순위 인덱스로 스타일을 반환한다 (0-based).
 * @param {number} idx
 */
function getRankStyle(idx) {
  return RANK_STYLES[idx] || {
    gradient: '',
    text: 'text-slate-500',
    bg: 'bg-slate-50',
    emoji: '',
  }
}

// ─── 바 색상 (랭킹 순서대로) ────────────────────────────────
const BAR_COLORS = ['#f59e0b', '#6366f1', '#ef4444', '#22c55e', '#8b5cf6', '#ec4899']

/**
 * 랭킹 페이지 컴포넌트.
 */
export default function Ranking() {
  const { data: rankings, isLoading, isError } = useRanking()
  const maxTiles = rankings?.[0]?.tile_count || 1

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight max-w-lg mx-auto">
          대학교 랭킹
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* 로딩 */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-400">랭킹을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">😵</div>
            <p className="text-sm font-semibold text-red-500">데이터를 불러오지 못했습니다</p>
            <p className="text-xs text-slate-400 mt-1">서버 연결을 확인해주세요</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && !isError && rankings?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏜️</div>
            <p className="text-sm font-semibold text-slate-500">아직 점령된 타일이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">지도에서 첫 타일을 점령해보세요!</p>
          </div>
        )}

        {/* 랭킹 카드 리스트 */}
        {rankings?.map((item, idx) => {
          const rs = getRankStyle(idx)
          const barColor = BAR_COLORS[idx % BAR_COLORS.length]

          return (
            <motion.div
              key={item.rank}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm shadow-slate-900/[0.04] border border-slate-100"
            >
              {/* 순위 뱃지 */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg flex-shrink-0 ${
                idx < 3
                  ? `bg-gradient-to-br ${rs.gradient} text-white shadow-md`
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {idx < 3 ? rs.emoji : item.rank}
              </div>

              {/* 대학 정보 + 바 */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-bold text-slate-700 truncate">
                    {item.university}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 ml-2 tabular-nums">
                    {item.tile_count}칸
                  </span>
                </div>
                {/* 점령 비율 바 */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.tile_count / maxTiles) * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* 안내 문구 */}
        {rankings?.length > 0 && (
          <p className="text-center text-slate-400 text-xs pt-3 pb-2 font-medium">
            실시간 점령 타일 수 기준으로 갱신됩니다
          </p>
        )}
      </div>
    </div>
  )
}
