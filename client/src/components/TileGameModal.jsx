import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGameStore from '../store/gameStore'
import {
  claimTileGame,
  createBossGameSocket,
  fetchTileGameConfig,
  startTileGameSession,
  submitTileGameAction,
} from '../lib/api'
import { getGameComponentEntry } from '../games/registry'

const WS_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LIVE: 'live',
  ERROR: 'error',
  CLOSED: 'closed',
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || error?.message || fallback
}

export default function TileGameModal({ tile, onClose, onSuccess }) {
  const user = useGameStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [config, setConfig] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [sessionStatus, setSessionStatus] = useState('READY')
  const [bossState, setBossState] = useState(null)
  const [remainingClicks, setRemainingClicks] = useState(null)
  const [busy, setBusy] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState(WS_STATUS.IDLE)

  const wsRef = useRef(null)
  const hitAckTimeoutRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  const gameEntry = useMemo(
    () => getGameComponentEntry(config?.game_type),
    [config?.game_type]
  )
  const GameComponent = gameEntry?.mode === 'component' ? gameEntry?.component : null
  const isBossGame = config?.game_type === 'boss_click'

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!tile?.grid_id) return

      setLoading(true)
      setError('')
      setMessage('')
      setConfig(null)
      setSessionId('')
      setSessionStatus('READY')
      setBossState(null)
      setRemainingClicks(null)
      setGameFinished(false)
      setRealtimeStatus(WS_STATUS.IDLE)

      try {
        const cfg = await fetchTileGameConfig(tile.grid_id)
        if (cancelled) return
        setConfig(cfg)

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
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Failed to initialize game session.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [tile?.grid_id, user?.nickname])

  const recordToServer = useCallback(
    async (result) => {
      if (!sessionId || !tile?.grid_id) return
      try {
        await submitTileGameAction(tile.grid_id, {
          session_id: sessionId,
          action_type: 'submit_result',
          success: Boolean(result.success),
          score: Number(result.score || 0),
          game_level: Number(result.gameLevel || 1),
          user_key: user?.nickname || 'anonymous',
        })
        await claimTileGame(tile.grid_id, sessionId)
      } catch {
        // Keep local game flow even if telemetry fails.
      }
    },
    [sessionId, tile?.grid_id, user?.nickname]
  )

  const handleBasicResult = useCallback(
    (result) => {
      if (gameFinished) return
      setGameFinished(true)

      if (result?.success) {
        setMessage('Mission success. Occupying tile...')
        recordToServer(result)
        onSuccessRef.current?.({
          success: true,
          gameLevel: Number(result.gameLevel || config?.level || 1),
          score: Number(result.score || 0),
        })
        return
      }

      setMessage('Mission failed. Try again.')
    },
    [config?.level, gameFinished, recordToServer]
  )

  const handleBossClaimAndOccupy = useCallback(
    async (scoreFromServer) => {
      if (gameFinished) return

      setGameFinished(true)
      try {
        await claimTileGame(tile.grid_id, sessionId)
      } catch {
        // Keep local success path if claim API is temporarily unavailable.
      }

      setMessage('Boss defeated. Occupying tile...')
      onSuccessRef.current?.({
        success: true,
        gameLevel: Number(config?.level || 2),
        score: Number(scoreFromServer || 0),
      })
    },
    [config?.level, gameFinished, sessionId, tile?.grid_id]
  )

  const handleBossHit = useCallback(async () => {
    if (!tile?.grid_id || !sessionId || busy || gameFinished) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Realtime connection is not ready. Please retry in a moment.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      wsRef.current.send(
        JSON.stringify({
          type: 'boss_hit',
          session_id: sessionId,
          user_key: user?.nickname || 'anonymous',
        })
      )

      if (hitAckTimeoutRef.current) {
        window.clearTimeout(hitAckTimeoutRef.current)
      }
      hitAckTimeoutRef.current = window.setTimeout(() => {
        setBusy(false)
        setMessage('Attack timeout. Please try again.')
      }, 6000)
    } catch (e) {
      setBusy(false)
      setError(getErrorMessage(e, 'Failed to send boss hit via realtime channel.'))
    }
  }, [busy, gameFinished, sessionId, tile?.grid_id, user?.nickname])

  useEffect(() => {
    if (!isBossGame || !tile?.grid_id) return

    let active = true
    let pingTimer = null

    try {
      const ws = createBossGameSocket(tile.grid_id)
      wsRef.current = ws
      setRealtimeStatus(WS_STATUS.CONNECTING)

      ws.onopen = () => {
        if (!active) return
        setRealtimeStatus(WS_STATUS.LIVE)
        ws.send(JSON.stringify({ type: 'sync' }))
      }

      ws.onmessage = (event) => {
        if (!active) return
        try {
          const payload = JSON.parse(event.data)

          if (payload?.type === 'boss_state') {
            if (payload?.boss_state) setBossState(payload.boss_state)
            return
          }

          if (payload?.type === 'pong') return

          if (payload?.type !== 'boss_hit_ack') return

          if (hitAckTimeoutRef.current) {
            window.clearTimeout(hitAckTimeoutRef.current)
            hitAckTimeoutRef.current = null
          }

          setBusy(false)
          if (payload?.session_status) setSessionStatus(payload.session_status)
          if (payload?.boss_state) setBossState(payload.boss_state)
          if (typeof payload?.remaining_clicks === 'number') {
            setRemainingClicks(payload.remaining_clicks)
          }

          if (!payload?.success) {
            setMessage(payload?.message || 'Attack failed.')
            return
          }

          if (!payload?.can_claim) {
            setMessage('Hit landed. Keep attacking.')
            return
          }

          void handleBossClaimAndOccupy(payload?.score)
        } catch {
          // Ignore malformed websocket payloads.
        }
      }

      ws.onerror = () => {
        if (!active) return
        setRealtimeStatus(WS_STATUS.ERROR)
      }

      ws.onclose = () => {
        if (!active) return
        setRealtimeStatus((prev) =>
          prev === WS_STATUS.ERROR ? WS_STATUS.ERROR : WS_STATUS.CLOSED
        )
      }

      pingTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 20000)
    } catch {
      setRealtimeStatus(WS_STATUS.ERROR)
    }

    return () => {
      active = false
      if (pingTimer) window.clearInterval(pingTimer)
      if (hitAckTimeoutRef.current) {
        window.clearTimeout(hitAckTimeoutRef.current)
        hitAckTimeoutRef.current = null
      }
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
  }, [handleBossClaimAndOccupy, isBossGame, tile?.grid_id])

  const modalTone = isBossGame
    ? {
        body: 'bg-slate-950 text-slate-100 border border-rose-300/20',
        header: 'border-b border-rose-300/20 bg-gradient-to-r from-rose-950 to-slate-950',
        close: 'bg-white/10 text-slate-100 hover:bg-white/20',
        loading: 'text-slate-300',
        message: 'border-t border-rose-300/20 bg-rose-950/30 text-rose-100',
      }
    : {
        body: 'bg-white text-slate-900 border border-slate-200',
        header: 'border-b border-slate-200 bg-white',
        close: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        loading: 'text-slate-500',
        message: 'border-t border-slate-200 bg-slate-50 text-slate-700',
      }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]">
      <div
        className={`w-full max-w-md overflow-hidden rounded-3xl shadow-2xl ${modalTone.body}`}
      >
        <div className={`flex items-center justify-between px-4 py-3 ${modalTone.header}`}>
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-indigo-300">MISSION</p>
            <p className="text-sm font-bold">{gameEntry?.title || 'Mini Game'}</p>
            <p className="text-[11px] text-slate-400">{tile?.grid_id}</p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${modalTone.close}`}
          >
            Close
          </button>
        </div>

        {loading && (
          <div className={`flex items-center gap-2 p-5 text-sm ${modalTone.loading}`}>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Preparing game...
          </div>
        )}

        {!loading && error && <div className="p-5 text-sm text-rose-400">{error}</div>}

        {!loading && !error && !GameComponent && (
          <div className="p-5 text-sm text-rose-400">No game component mapped.</div>
        )}

        {!loading && !error && GameComponent && (
          <GameComponent
            busy={busy}
            config={config}
            bossState={bossState}
            remainingClicks={remainingClicks}
            sessionStatus={sessionStatus}
            realtimeStatus={realtimeStatus}
            onSubmitResult={handleBasicResult}
            onBossHit={handleBossHit}
          />
        )}

        {message && <div className={`px-4 py-3 text-sm font-medium ${modalTone.message}`}>{message}</div>}
      </div>
    </div>
  )
}
