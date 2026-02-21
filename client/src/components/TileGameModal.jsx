/**
 * 타일 미니게임 모달
 * ──────────────────
 * 게임 성공 시 즉시 onSuccess를 호출하여 점령 API를 트리거한다.
 * 서버 세션(submit/claim)은 백그라운드로 처리하여 체인 끊김을 방지한다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useGameStore from '../store/gameStore'
import {
  fetchTileGameConfig,
  startTileGameSession,
  submitTileGameAction,
  claimTileGame,
} from '../lib/api'
import { getGameComponentEntry } from '../games/registry'

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

  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  const gameEntry = useMemo(
    () => getGameComponentEntry(config?.game_type),
    [config?.game_type]
  )
  const GameComponent = gameEntry?.mode === 'component' ? gameEntry?.component : null

  // ─── 세션 부트스트랩 ─────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!tile?.grid_id) return

      setLoading(true)
      setError('')
      setMessage('')
      setConfig(null)
      setSessionId('')
      setGameFinished(false)

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
        if (!cancelled) setError(getErrorMessage(e, '게임 세션 초기화 실패'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => { cancelled = true }
  }, [tile?.grid_id, user?.nickname])

  // ─── 서버에 결과 기록 (백그라운드, 점령과 무관) ───────
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
    } catch {
      // 서버 기록 실패해도 점령 플로우에 영향 없음
    }
  }, [sessionId, tile?.grid_id, user?.nickname])

  // ─── 기본 게임 결과 처리 ─────────────────────────────
  const handleBasicResult = useCallback((result) => {
    if (gameFinished) return
    setGameFinished(true)

    if (result?.success) {
      setMessage('🎉 성공! 점령 중...')
      recordToServer(result)
      onSuccessRef.current?.({
        success: true,
        gameLevel: Number(result.gameLevel || config?.level || 1),
        score: Number(result.score || 0),
      })
    } else {
      setMessage('😢 아쉽게 실패했어요. 다시 도전해보세요!')
    }
  }, [config?.level, gameFinished, recordToServer])

  // ─── 보스 게임 히트 ──────────────────────────────────
  const handleBossHit = useCallback(async () => {
    if (!tile?.grid_id || !sessionId || busy) return

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
        setMessage(action.message || '공격 실패')
        return
      }

      if (action.can_claim) {
        try { await claimTileGame(tile.grid_id, sessionId) } catch { /* ignore */ }
        setMessage('🎉 보스 처치! 점령 중...')
        onSuccessRef.current?.({
          success: true,
          gameLevel: Number(config?.level || 2),
          score: Number(action.score || 0),
        })
      } else {
        setMessage('공격 성공! 계속 때려!')
      }
    } catch (e) {
      setError(getErrorMessage(e, '공격 처리 실패'))
    } finally {
      setBusy(false)
    }
  }, [busy, config?.level, sessionId, tile?.grid_id, user?.nickname])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-slate-800">
              {gameEntry?.title || '미니게임'}
            </p>
            <p className="text-[11px] text-slate-400">{tile?.grid_id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 active:bg-slate-200"
          >
            닫기
          </button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center gap-2 p-5 text-sm text-slate-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            게임 준비 중...
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="p-5 text-sm text-rose-600">{error}</div>
        )}

        {/* 게임 컴포넌트 없음 */}
        {!loading && !error && !GameComponent && (
          <div className="p-5 text-sm text-rose-600">
            이 타일의 게임을 불러올 수 없습니다.
          </div>
        )}

        {/* 게임 컴포넌트 렌더링 */}
        {!loading && !error && GameComponent && (
          <GameComponent
            busy={busy}
            config={config}
            bossState={bossState}
            remainingClicks={remainingClicks}
            sessionStatus={sessionStatus}
            onSubmitResult={handleBasicResult}
            onBossHit={handleBossHit}
          />
        )}

        {/* 결과 메시지 */}
        {message && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
