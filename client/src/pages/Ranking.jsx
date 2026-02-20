/**
 * 랭킹 페이지
 * ───────────
 * 대학교별 점령 현황 순위를 보여준다.
 * MVP 단계에서는 더미 데이터를 표시한다.
 */

// ─── 더미 랭킹 데이터 (추후 API 연동) ──────────────────────
const DUMMY_RANKINGS = [
  { rank: 1, university: '서울대학교', tiles: 142, color: '#3b82f6' },
  { rank: 2, university: '연세대학교', tiles: 98, color: '#ef4444' },
  { rank: 3, university: '고려대학교', tiles: 87, color: '#a855f7' },
  { rank: 4, university: '한양대학교', tiles: 65, color: '#f59e0b' },
  { rank: 5, university: '성균관대학교', tiles: 43, color: '#22c55e' },
]

/**
 * 랭킹 페이지 컴포넌트.
 * 대학교별 점령 타일 수를 기준으로 순위를 표시한다.
 */
export default function Ranking() {
  const maxTiles = DUMMY_RANKINGS[0]?.tiles || 1

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* 헤더 */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-surface-light px-4 py-3">
        <h1 className="text-lg font-bold text-primary max-w-lg mx-auto">
          대학교 랭킹
        </h1>
      </header>

      {/* 랭킹 리스트 */}
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {DUMMY_RANKINGS.map((item) => (
          <div
            key={item.rank}
            className="bg-surface-light rounded-xl p-4 flex items-center gap-4"
          >
            {/* 순위 뱃지 */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                item.rank <= 3
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface text-text-secondary'
              }`}
            >
              {item.rank}
            </div>

            {/* 대학 정보 + 바 */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-text-primary truncate">
                  {item.university}
                </span>
                <span className="text-sm text-text-secondary ml-2">
                  {item.tiles}칸
                </span>
              </div>
              {/* 점령 비율 바 */}
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.tiles / maxTiles) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* 안내 문구 */}
        <p className="text-center text-text-secondary text-xs pt-4">
          랭킹은 실시간 점령 타일 수를 기준으로 갱신됩니다.
        </p>
      </div>
    </div>
  )
}
