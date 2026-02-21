/**
 * TileGameModal (하이브리드 버전)
 * ───────────────────────────────────────────────────
 * 일반 타일: game1~10 중 하나를 랜덤 선택해 iframe으로 렌더링
 * 특수 타일(보스전 등): Backend에서 설정(config)을 받아 React Component 렌더링 및 WebSocket 연결
 */

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

const GAME_IDS = Array.from({ length: 10 }, (_, index) => index + 1)
const IFRAME_LOAD_TIMEOUT_MS = 8000
const MAX_AUTO_RETRIES = GAME_IDS.length - 1

const WS_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LIVE: 'live',
  ERROR: 'error',
  CLOSED: 'closed',
}

function pickRandomGameId(excludeId = null) {
  const candidates = excludeId
    ? GAME_IDS.filter((id) => id !== excludeId)
    : GAME_IDS
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || error?.message || fallback
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
    try { payload = JSON.parse(payload) } catch { return null }
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function TileGameModal({ tile, onClose, onSuccess }) {
  const user = useGameStore((s) => s.user)
  
  // ─── Ref ─────────────────────────────────────────────────
  const iframeRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  const successHandledRef = useRef(false)
  const wsRef = useRef(null)
  const hitAckTimeoutRef = useRef(null)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  // ─── 공통 상태 ───────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // ─── 특수 타일 (Boss/Component) 상태 ──────────────────────
  const [config, setConfig] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [sessionStatus, setSessionStatus] = useState('READY')
  const [bossState, setBossState] = useState(null)
  const [remainingClicks, setRemainingClicks] = useState(null)
  const [busy, setBusy] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState(WS_STATUS.IDLE)

  // ─── 일반 타일 (Iframe) 상태 ─────────────────────────────
  const [selectedGameId, setSelectedGameId] = useState(() => pickRandomGameId())
  const [reloadNonce, setReloadNonce] = useState(0)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const gameEntry = useMemo(() => getGameComponentEntry(config?.game_type), [config?.game_type])
  const GameComponent = gameEntry?.mode === 'component' ? gameEntry?.component : null
  const isBossGame = config?.game_type === 'boss_click'
  const gameUrl = useMemo(() => buildGameUrl(selectedGameId, reloadNonce), [selectedGameId, reloadNonce])

  // ─── 데이터 초기화 (Bootstrap) ───────────────────────────
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setLoading(true)
      setError('')
      setConfig(null)
      
      try {
        // 1. 서버에 이 타일이 특수 타일인지 확인 요청
        let conf = null
        try {
          conf = await fetchTileGameConfig(tile?.grid_id)
        } catch (e) {
          console.warn('[TileGameModal] No special config found, falling back to iframe.', e)
        }

        if (cancelled) return
        setConfig(conf)

        // 2. 특수 타일(보스전 등)인 경우 세션 발급
        if (conf && conf.game_type && conf.game_type !== 'default') {
          const started = await startTileGameSession(tile?.grid_id)
          if (cancelled) return

          setSessionId(started.session_id)
          setSessionStatus(started.session_status)
          if (started.boss_state) {
            setBossState(started.boss_state)
            setRemainingClicks(started.boss_state.click_limit_per_user ?? null)
          }
        }
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, '게임 세션을 초기화하는데 실패했습니다.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (tile?.grid_id) bootstrap()
    return () => { cancelled = true }
  }, [tile?.grid_id, user?.nickname])

  // ─── Iframe (일반 타일) 전용 로직 ────────────────────────
  const rotateToAnotherGame = useCallback((statusMessage = '') => {
    successHandledRef.current = false
    setSelectedGameId((prev) => pickRandomGameId(prev))
    setReloadNonce((prev) => prev + 1)
    setIframeLoaded(false)
    setLoadError('')
    if (statusMessage) setMessage(statusMessage)
  }, [])

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
    if (GameComponent) return // 컴포넌트 모드일 땐 무시

    const timerId = window.setTimeout(() => {
      if (!iframeLoaded && !loadError) failoverToAnotherGame('게임 로딩에 실패했습니다. 다시 시도해주세요.')
    }, IFRAME_LOAD_TIMEOUT_MS)

    return () => window.clearTimeout(timerId)
  }, [failoverToAnotherGame, iframeLoaded, loadError, gameUrl, GameComponent])

  useEffect(() => {
    if (GameComponent) return

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return
      const frameWindow = iframeRef.current?.contentWindow
      if (!frameWindow || event.source !== frameWindow) return

      const result = normalizeGameResultMessage(event.data)
      if (!result) return

      if (result.success) {
        if (successHandledRef.current) return
        successHandledRef.current = true
        setMessage(`GAME ${result.gameId} 성공! 점령 처리 중...`)
        onSuccessRef.current?.({
          success: true,
          score: result.score,
          gameLevel: result.gameLevel,
          gameId: result.gameId,
        })
      } else {
        setMessage(`GAME ${result.gameId} 실패! 다시 도전해보세요.`)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [selectedGameId, tile?.grid_id, GameComponent])

  // ─── Boss/Component (특수 타일) 전용 로직 ────────────────
  const recordToServer = useCallback(async (result) => {
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
    } catch { /* Telemetry fallback */ }
  }, [sessionId, tile?.grid_id, user?.nickname])

  const handleBasicResult = useCallback((result) => {
    if (gameFinished) return
    setGameFinished(true)

    if (result?.success) {
      setMessage('임무 성공! 영토를 점령합니다.')
      recordToServer(result)
      onSuccessRef.current?.({
        success: true,
        gameLevel: Number(result.gameLevel || config?.level || 1),
        score: Number(result.score || 0),
      })
    } else {
      setMessage('임무 실패. 다시 시도해주세요.')
    }
  }, [config?.level, gameFinished, recordToServer])

  const handleBossClaimAndOccupy = useCallback(async (scoreFromServer) => {
    if (gameFinished) return
    setGameFinished(true)
    try {
      await claimTileGame(tile.grid_id, sessionId)
    } catch {}
    setMessage('보스를 처치했습니다! 영토를 점령합니다.')
    onSuccessRef.current?.({
      success: true,
      gameLevel: Number(config?.level || 2),
      score: Number(scoreFromServer || 0),
    })
  }, [config?.level, gameFinished, sessionId, tile?.grid_id])

  const handleBossHit = useCallback(async () => {
    if (!tile?.grid_id || !sessionId || busy || gameFinished) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('실시간 연결이 불안정합니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setBusy(true)
    setError('')
    try {
      wsRef.current.send(JSON.stringify({
        type: 'boss_hit',
        session_id: sessionId,
        user_key: user?.nickname || 'anonymous',
      }))

      if (hitAckTimeoutRef.current) window.clearTimeout(hitAckTimeoutRef.current)
      hitAckTimeoutRef.current = window.setTimeout(() => {
        setBusy(false)
        setMessage('공격 시간 초과. 다시 공격해주세요.')
      }, 6000)
    } catch (e) {
      setBusy(false)
      setError(getErrorMessage(e, '공격 전송에 실패했습니다.'))
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
          if (typeof payload?.remaining_clicks === 'number') setRemainingClicks(payload.remaining_clicks)

          if (!payload?.success) {
            setMessage(payload?.message || '공격이 빗나갔습니다.')
            return
          }
          if (!payload?.can_claim) {
            setMessage('공격 성공! 계속 때리세요!')
            return
          }
          void handleBossClaimAndOccupy(payload?.score)
        } catch {}
      }
      ws.onerror = () => { if (active) setRealtimeStatus(WS_STATUS.ERROR) }
      ws.onclose = () => { if (active) setRealtimeStatus((prev) => prev === WS_STATUS.ERROR ? WS_STATUS.ERROR : WS_STATUS.CLOSED) }

      pingTimer = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
      }, 20000)
    } catch {
      setRealtimeStatus(WS_STATUS.ERROR)
    }

    return () => {
      active = false
      if (pingTimer) window.clearInterval(pingTimer)
      if (hitAckTimeoutRef.current) window.clearTimeout(hitAckTimeoutRef.current)
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) wsRef.current.close()
    }
  }, [handleBossClaimAndOccupy, isBossGame, tile?.grid_id])

  // ─── UI 테마 (보스전 vs 일반) ──────────────────────────────
  const modalTone = isBossGame
    ? {
        body: 'bg-slate-950 text-slate-100 border border-rose-500/30',
        header: 'bg-gradient-to-r from-rose-950 to-slate-950 border-b border-rose-500/20',
        close: 'bg-white/10 text-white hover:bg-white/20 active:scale-95',
        loading: 'text-rose-200',
        message: 'bg-rose-950/50 text-rose-100 border-t border-rose-500/20',
      }
    : {
        body: 'bg-white text-slate-900 border border-slate-200',
        header: 'bg-white border-b border-slate-100',
        close: 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95',
        loading: 'text-indigo-500',
        message: 'bg-indigo-50 text-indigo-700 border-t border-indigo-100',
      }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md overflow-hidden rounded-[28px] shadow-2xl flex flex-col ${modalTone.body}`}>
        
        {/* 공통 헤더 */}
        <div className={`flex items-center justify-between px-5 py-4 ${modalTone.header}`}>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-[#5C6BFA] mb-0.5">MISSION</p>
            <p className="text-[18px] font-bold tracking-tight">
              {GameComponent ? (gameEntry?.title || '특수 임무') : '랜덤 미니게임'}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-medium opacity-70">
              <span className="truncate">{tile?.grid_id}</span>
              {!GameComponent && (
                <span className="rounded bg-black/5 px-2 py-0.5 font-bold">GAME {selectedGameId}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${modalTone.close}`}>
            닫기
          </button>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="relative flex-1 min-h-[420px] max-h-[620px] flex flex-col bg-slate-50">
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-inherit">
              <span className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent ${modalTone.loading}`} />
              <p className="text-[13px] font-bold text-slate-500">게임 데이터를 불러오는 중...</p>
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 bg-inherit">
              <p className="text-[14px] font-bold text-rose-500">{error}</p>
            </div>
          )}

          {/* 특수 타일 (보스전 등) 렌더링 */}
          {!loading && !error && GameComponent && (
            <div className="flex-1 overflow-y-auto p-5 bg-inherit">
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
            </div>
          )}

          {/* 일반 타일 (Iframe 미니게임) 렌더링 */}
          {!loading && !error && !GameComponent && (
            <>
              <div className="relative flex-1">
                <iframe
                  ref={iframeRef}
                  key={gameUrl}
                  src={gameUrl}
                  title={`public-game-${selectedGameId}`}
                  onLoad={() => { setIframeLoaded(true); setLoadError(''); }}
                  onError={() => failoverToAnotherGame('게임 파일 로딩 실패.')}
                  className="h-full w-full border-0 bg-white"
                />
                {!iframeLoaded && !loadError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95">
                    <span className="mx-auto mb-3 inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
                    <p className="text-[13px] font-bold text-slate-500">미니게임 로딩 중...</p>
                  </div>
                )}
                {loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white p-6 text-center">
                    <p className="text-[14px] font-bold text-rose-500">{loadError}</p>
                  </div>
                )}
              </div>
              
              {/* Iframe 하단 컨트롤바 */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
                <p className="text-[12px] font-medium text-slate-500">
                  {message || '게임 성공 시 자동으로 점령 처리됩니다.'}
                </p>
                <button
                  onClick={() => { setAutoRetryCount(0); rotateToAnotherGame('새 랜덤 게임을 불러오는 중...'); }}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-[12px] font-extrabold text-slate-600 transition-colors hover:bg-slate-200 active:scale-95"
                >
                  다른 게임
                </button>
              </div>
            </>
          )}
        </div>

        {/* 특수 타일 글로벌 메시지 바 */}
        {message && GameComponent && (
          <div className={`px-5 py-4 text-[13px] font-bold text-center ${modalTone.message}`}>
            {message}
          </div>
        )}

      </div>
    </div>
  )
}