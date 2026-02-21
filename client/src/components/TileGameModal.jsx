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

  useEffect(() => {
    onMissionSuccessRef.current = onMissionSuccess
  }, [onMissionSuccess])

  const gameUrl = useMemo(
    () => buildGameUrl(selectedGameId, reloadNonce),
    [selectedGameId, reloadNonce]
  )

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
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 active:bg-slate-200"
          >
            닫기
          </button>
        </div>

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
      </div>
    </div>
  )
}
