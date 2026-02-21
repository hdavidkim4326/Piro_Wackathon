<<<<<<< HEAD
/**
 * 타일 미니게임 모달 (public 정적 게임 iframe 버전)
 * ───────────────────────────────────────────────────
 * - game1~10 중 하나를 랜덤 선택해 iframe으로 렌더링
 * - iframe 내부 window.parent.postMessage(GAME_RESULT) 수신
 * - 성공 메시지 수신 시 onMissionSuccess(gridId) 단일 경로를 호출
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const GAME_IDS = Array.from({ length: 10 }, (_, index) => index + 1)
const IFRAME_LOAD_TIMEOUT_MS = 8000
const MAX_AUTO_RETRIES = GAME_IDS.length - 1

function pickRandomGameId(excludeId = null) {
  const candidates = excludeId
    ? GAME_IDS.filter((id) => id !== excludeId)
    : GAME_IDS
  return candidates[Math.floor(Math.random() * candidates.length)]
=======
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
>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return '/'
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function buildGameUrl(gameId, nonce) {
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)
  return `${baseUrl}games/game${gameId}/index.html?v=${nonce}`
}

function normalizeGameResultMessage(data) {
  let payload = data

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      return null
    }
  }

  if (!payload || typeof payload !== 'object') return null
  if (payload.type !== 'GAME_RESULT') return null

  const gameId = Number(payload.gameId)
  if (!Number.isInteger(gameId) || gameId < 1) return null

  const rawSuccess = payload.success
  let success = null
  if (typeof rawSuccess === 'boolean') {
    success = rawSuccess
  } else if (typeof rawSuccess === 'string') {
    const lowered = rawSuccess.trim().toLowerCase()
    if (lowered === 'true' || lowered === 'success') success = true
    if (lowered === 'false' || lowered === 'fail' || lowered === 'failed') success = false
  }
  if (success === null) return null

  const score = Number(payload.score)
  const gameLevel = Number(payload.gameLevel ?? payload.level)

  return {
    success,
    score: Number.isFinite(score) ? score : 0,
    gameLevel: Number.isFinite(gameLevel) && gameLevel > 0 ? gameLevel : 1,
    gameId,
  }
}

export default function TileGameModal({ tile, onClose, onMissionSuccess }) {
  const iframeRef = useRef(null)
  const onMissionSuccessRef = useRef(onMissionSuccess)
  const successHandledRef = useRef(false)

  const [selectedGameId, setSelectedGameId] = useState(() => pickRandomGameId())
  const [reloadNonce, setReloadNonce] = useState(0)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')

<<<<<<< HEAD
=======
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

>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650
  useEffect(() => {
    onMissionSuccessRef.current = onMissionSuccess
  }, [onMissionSuccess])

  const gameUrl = useMemo(
    () => buildGameUrl(selectedGameId, reloadNonce),
    [selectedGameId, reloadNonce]
  )

<<<<<<< HEAD
  const rotateToAnotherGame = useCallback((statusMessage = '') => {
    successHandledRef.current = false
    setSelectedGameId((prev) => pickRandomGameId(prev))
    setReloadNonce((prev) => prev + 1)
    setIframeLoaded(false)
    setLoadError('')
    if (statusMessage) setMessage(statusMessage)
  }, [])
=======
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
>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650

  const failoverToAnotherGame = useCallback((reason) => {
    setAutoRetryCount((prev) => {
      if (prev >= MAX_AUTO_RETRIES) {
        setLoadError(reason)
        return prev
      }

      rotateToAnotherGame('로딩 이슈로 다른 게임을 자동 선택합니다...')
      return prev + 1
    })
  }, [rotateToAnotherGame])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (!iframeLoaded && !loadError) {
        failoverToAnotherGame('게임 로딩에 실패했습니다. 다시 시도해주세요.')
      }
    }, IFRAME_LOAD_TIMEOUT_MS)

    return () => window.clearTimeout(timerId)
  }, [failoverToAnotherGame, iframeLoaded, loadError, gameUrl])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return

      const frameWindow = iframeRef.current?.contentWindow
      if (!frameWindow || event.source !== frameWindow) return

      const result = normalizeGameResultMessage(event.data)
      if (!result) return

      const resolvedGameId = selectedGameId
      if (result.gameId && result.gameId !== selectedGameId) {
        console.warn(
          '[TileGameModal] postMessage gameId mismatch:',
          result.gameId,
          'loaded:',
          selectedGameId
        )
      }

      if (result.success) {
        if (successHandledRef.current) return
        successHandledRef.current = true
        console.log('[TileGameModal] mission success:', {
          gridId: tile?.grid_id,
          gameId: resolvedGameId,
        })
<<<<<<< HEAD
        setMessage(`GAME ${resolvedGameId} 성공! 점령 처리 중...`)
        onMissionSuccessRef.current?.(tile?.grid_id, {
          success: true,
          score: result.score,
          gameLevel: result.gameLevel,
          gameId: resolvedGameId,
        })
      } else {
        console.log('[TileGameModal] mission failed:', {
          gridId: tile?.grid_id,
          gameId: resolvedGameId,
        })
        setMessage(`GAME ${resolvedGameId} 실패! 다시 도전해보세요.`)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [selectedGameId, tile?.grid_id])

  const handleIframeLoad = () => {
    setIframeLoaded(true)
    setLoadError('')
    setMessage(`GAME ${selectedGameId} 로딩 완료`)
  }

  const handleIframeError = () => {
    failoverToAnotherGame('게임 파일 로딩 실패. 자동으로 다른 게임을 불러옵니다.')
  }

  const handleManualReload = () => {
    setAutoRetryCount(0)
    rotateToAnotherGame('새 랜덤 게임을 불러오는 중...')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              랜덤 미니게임
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="truncate">{tile?.grid_id}</span>
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-600">
                GAME {selectedGameId}
              </span>
              {autoRetryCount > 0 && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-600">
                  Retry {autoRetryCount}
                </span>
              )}
            </div>
=======
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
>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${modalTone.close}`}
          >
            Close
          </button>
        </div>

<<<<<<< HEAD
        {!loadError && (
          <div className="relative h-[70dvh] max-h-[620px] min-h-[420px] bg-slate-100">
            <iframe
              ref={iframeRef}
              key={gameUrl}
              src={gameUrl}
              title={`public-game-${selectedGameId}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="accelerometer; gyroscope"
              className="h-full w-full border-0 bg-white"
            />

            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95">
                <div className="text-center text-sm font-medium text-slate-500">
                  <span className="mx-auto mb-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p>게임 로딩 중...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {loadError && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{loadError}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="min-h-[20px] text-xs font-medium text-slate-600">
            {message || '게임 성공 시 자동으로 점령 처리됩니다.'}
          </p>
          <button
            onClick={handleManualReload}
            className="shrink-0 rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 active:bg-slate-300"
          >
            다른 게임
          </button>
        </div>
=======
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
>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650
      </div>
    </div>
  )
}
