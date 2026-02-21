import { useRanking } from '../hooks/useTiles'

export default function Ranking() {
  const { data: rankings, isLoading, isError } = useRanking()
  const maxTiles = rankings?.[0]?.tile_count || 1

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <h1 className="mx-auto max-w-lg text-xl font-bold text-slate-800">
          University Ranking
        </h1>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4">
        {isLoading && (
          <div className="py-16 text-center text-sm font-semibold text-slate-400">
            Loading ranking...
          </div>
        )}

        {isError && (
          <div className="py-16 text-center text-sm font-semibold text-rose-500">
            Failed to load ranking.
          </div>
        )}

        {!isLoading && !isError && rankings?.length === 0 && (
          <div className="py-16 text-center text-sm font-semibold text-slate-500">
            No ranking data yet.
          </div>
        )}

        {rankings?.map((item) => (
          <div
            key={item.rank}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.04]"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-bold text-slate-700">
                #{item.rank} {item.university}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {item.tile_count} tiles
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${(item.tile_count / maxTiles) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
