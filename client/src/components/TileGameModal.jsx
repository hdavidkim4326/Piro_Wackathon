import { useEffect, useMemo, useState } from 'react'

const GAME_CATALOG = [
  {
    id: 'game1',
    title: 'Stage 1 - Rapid Tap',
    path: '/games/game1/index.html',
  },
  {
    id: 'game2',
    title: 'Stage 1 - Rock Paper Scissors',
    path: '/games/game2/index.html',
  },
  {
    id: 'game3',
    title: 'Stage 1 - Timing Hit',
    path: '/games/game3/index.html',
  },
]

function pickGameByTile(gridId) {
  if (!gridId || GAME_CATALOG.length === 0) return null

  const parts = gridId.split('_')
  if (parts.length === 3) {
    const row = Number(parts[1])
    const col = Number(parts[2])

    if (Number.isFinite(row) && Number.isFinite(col)) {
      const seed = Math.abs(row * 17 + col * 31)
      return GAME_CATALOG[seed % GAME_CATALOG.length]
    }
  }

  let fallbackHash = 0
  for (let i = 0; i < gridId.length; i += 1) {
    fallbackHash = (fallbackHash * 31 + gridId.charCodeAt(i)) >>> 0
  }

  return GAME_CATALOG[fallbackHash % GAME_CATALOG.length]
}

export default function TileGameModal({ tile, onClose, onSuccess }) {
  const [latestResult, setLatestResult] = useState(null)
  const game = useMemo(() => pickGameByTile(tile?.grid_id), [tile?.grid_id])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'GAME_RESULT') return

      const result = {
        success: Boolean(event.data.success),
        score: Number(event.data.score || 0),
        gameLevel: Number(event.data.gameLevel || 1),
      }

      setLatestResult(result)

      if (result.success) {
        onSuccess?.(result)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSuccess])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Land Capture Game</p>
            <p className="text-xs text-slate-500">{tile?.grid_id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            Close
          </button>
        </div>

        {!game && (
          <div className="p-5 text-sm text-rose-600">
            No playable game is configured yet.
          </div>
        )}

        {game && (
          <>
            <div className="px-4 pt-3 text-xs font-medium text-slate-500">{game.title}</div>
            <iframe
              title={game.title}
              src={game.path}
              className="h-[420px] w-full border-0"
              allow="fullscreen"
            />
          </>
        )}

        {latestResult && (
          <div
            className={`border-t px-4 py-3 text-sm ${
              latestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {latestResult.success
              ? `Success! Score ${latestResult.score}. Occupying...`
              : `Failed. Score ${latestResult.score}. Try again.`}
          </div>
        )}
      </div>
    </div>
  )
}
