import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGameStore from '../store/gameStore'
import {
  claimTileGame,
  fetchTileGameConfig,
  startTileGameSession,
  submitTileGameAction,
} from '../lib/api'
import { getGameComponentEntry } from '../games/registry'

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || error?.message || fallback
}

export default function TileGameModal({ tile, onClose, onSuccess }) {
  const user = useGameStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [config, setConfig] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [sessionStatus, setSessionStatus] = useState('READY')
  const [bossState, setBossState] = useState(null)
  const [remainingClicks, setRemainingClicks] = useState(null)
  const iframeRef = useRef(null)

  const gameEntry = useMemo(
    () => getGameComponentEntry(config?.game_type),
    [config?.game_type]
  )
  const isIframeGame = Boolean(gameEntry?.mode === 'iframe' && gameEntry?.iframeSrc)
  const GameComponent =
    gameEntry?.mode === 'component' ? gameEntry?.component || null : null

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!tile?.grid_id) return

      setLoading(true)
      setBusy(false)
      setError('')
      setMessage('')
      setConfig(null)
      setSessionId('')
      setSessionStatus('READY')
      setBossState(null)
      setRemainingClicks(null)

      try {
        const nextConfig = await fetchTileGameConfig(tile.grid_id)
        if (cancelled) return

        setConfig(nextConfig)

        const started = await startTileGameSession(tile.grid_id, {
          userKey: user?.nickname || 'anonymous',
        })
        if (cancelled) return

        setSessionId(started.session_id)
        setSessionStatus(started.session_status)

        if (started.boss_state) {
          setBossState(started.boss_state)
          setRemainingClicks(started.boss_state.click_limit_per_user ?? null)
        }
      } catch (requestError) {
        if (cancelled) return
        setError(getErrorMessage(requestError, 'Failed to initialize game session.'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [tile?.grid_id, user?.nickname])

  const handleBasicResult = useCallback(async (result) => {
    if (!tile?.grid_id || !sessionId || !config) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const action = await submitTileGameAction(tile.grid_id, {
        session_id: sessionId,
        action_type: 'submit_result',
        success: Boolean(result?.success),
        score: Number(result?.score || 0),
        game_level: Number(result?.gameLevel || config.level || 1),
        user_key: user?.nickname || 'anonymous',
      })

      setSessionStatus(action.session_status)

      if (!action.success) {
        setMessage('Game result submitted as failed. Try another tile.')
        return
      }

      if (!action.can_claim) {
        setMessage('Result received, but claim is not available.')
        return
      }

      const claim = await claimTileGame(tile.grid_id, sessionId)
      if (!claim.can_claim) {
        setMessage('Claim rejected by server.')
        return
      }

      setMessage('Claim approved. Occupying tile...')
      onSuccess?.({
        success: true,
        gameLevel: Number(result?.gameLevel || config.level || 1),
        score: Number(result?.score || 0),
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to submit game result.'))
    } finally {
      setBusy(false)
    }
  }, [config, onSuccess, sessionId, tile?.grid_id, user?.nickname])

  const handleBossHit = useCallback(async () => {
    if (!tile?.grid_id || !sessionId) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const action = await submitTileGameAction(tile.grid_id, {
        session_id: sessionId,
        action_type: 'boss_hit',
        user_key: user?.nickname || 'anonymous',
      })

      setSessionStatus(action.session_status)
      if (action.boss_state) setBossState(action.boss_state)
      if (typeof action.remaining_clicks === 'number') {
        setRemainingClicks(action.remaining_clicks)
      }

      if (!action.success) {
        setMessage(action.message || 'Boss hit failed.')
        return
      }

      if (!action.can_claim) {
        setMessage('Boss hit applied. Keep attacking.')
        return
      }

      const claim = await claimTileGame(tile.grid_id, sessionId)
      if (!claim.can_claim) {
        setMessage('Boss defeated but claim rejected.')
        return
      }

      setMessage('Boss defeated. Occupying tile...')
      onSuccess?.({
        success: true,
        gameLevel: Number(config?.level || 2),
        score: Number(action.score || 0),
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to apply boss hit.'))
    } finally {
      setBusy(false)
    }
  }, [config?.level, onSuccess, sessionId, tile?.grid_id, user?.nickname])

  useEffect(() => {
    if (!isIframeGame || !tile?.grid_id || !sessionId) return

    const handleMessage = (event) => {
      const iframeWindow = iframeRef.current?.contentWindow
      if (!iframeWindow) return
      if (event.source !== iframeWindow) return

      const data = event.data
      if (!data || data.type !== 'GAME_RESULT') return
      if (busy) return

      void handleBasicResult({
        success: Boolean(data.success),
        score: Number(data.score || 0),
        gameLevel: Number(data.gameLevel || config?.level || 1),
      })
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [busy, config?.level, handleBasicResult, isIframeGame, sessionId, tile?.grid_id])

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

        {loading && (
          <div className="p-5 text-sm text-slate-600">Loading game session...</div>
        )}

        {!loading && error && (
          <div className="p-5 text-sm text-rose-600">{error}</div>
        )}

        {!loading && !error && !isIframeGame && !GameComponent && (
          <div className="p-5 text-sm text-rose-600">
            No game component found for this tile.
          </div>
        )}

        {!loading && !error && isIframeGame && (
          <>
            <div className="px-4 pt-3 text-xs font-medium text-slate-500">
              {gameEntry?.title || config?.title || 'Game'}
            </div>
            <div className="p-4">
              <iframe
                ref={iframeRef}
                title={gameEntry?.title || 'Basic Mini Game'}
                src={gameEntry.iframeSrc}
                className="h-[460px] w-full rounded-xl border border-slate-200"
              />
              <p className="mt-2 text-xs text-slate-500">
                Finish the mini game to auto-submit result.
              </p>
            </div>
          </>
        )}

        {!loading && !error && !isIframeGame && GameComponent && (
          <>
            <div className="px-4 pt-3 text-xs font-medium text-slate-500">
              {gameEntry?.title || config?.title || 'Game'}
            </div>
            <GameComponent
              busy={busy}
              config={config}
              bossState={bossState}
              remainingClicks={remainingClicks}
              sessionStatus={sessionStatus}
              onSubmitResult={handleBasicResult}
              onBossHit={handleBossHit}
            />
          </>
        )}

        {message && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
