import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { createBossGameSocket, startTileGameSession } from '../lib/api'
import { useClaimSpecialMission } from '../hooks/useTiles'

const K = {
  requestFail: '\uD2B9\uC218 \uBBF8\uC158 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  wsLive: '\uC2E4\uC2DC\uAC04',
  wsConnecting: '\uC5F0\uACB0 \uC911',
  wsError: '\uC624\uB958',
  wsClosed: '\uC885\uB8CC',
  wsIdle: '\uB300\uAE30',
  claimApplying: '\uBCF4\uC2A4 \uCC98\uCE58 \uC644\uB8CC. \uC810\uB839 \uBC18\uC601 \uC911...',
  captureSuccessPrefix: '\uC810\uB839 \uC131\uACF5! ',
  captureSuccessSuffix: '\uCE78 \uBC18\uC601 \uC644\uB8CC',
  captureAlready: '\uC774\uBBF8 \uBC18\uC601\uB41C \uC810\uB839\uC785\uB2C8\uB2E4.',
  claimFailed: '\uC810\uB839 \uBC18\uC601 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  invalidCenter: '\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD2B9\uC218 \uC911\uC2EC \uD0C0\uC77C\uC785\uB2C8\uB2E4.',
  connectingRoom: '\uD2B9\uC218 \uBBF8\uC158 \uBC29\uC5D0 \uC5F0\uACB0 \uC911...',
  alreadyDefeated: '\uC774\uBBF8 \uCC98\uCE58\uB41C \uBCF4\uC2A4\uC785\uB2C8\uB2E4. \uC810\uB839 \uD655\uC778 \uC911...',
  connected: '\uC5F0\uACB0 \uC644\uB8CC! \uB545\uCF69\uC744 \uD0ED\uD574\uC11C \uACF5\uACA9\uD558\uC138\uC694.',
  attackRejected: '\uACF5\uACA9 \uC694\uCCAD\uC774 \uAC70\uBD80\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
  hitSuccess: '\uD0C0\uACA9 \uC131\uACF5!',
  socketError: '\uC2E4\uC2DC\uAC04 \uC18C\uCF13 \uC5F0\uACB0 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.',
  startFailed: '\uD2B9\uC218 \uBBF8\uC158 \uC2DC\uC791\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  titleMission: '\uD2B9\uC218 \uBBF8\uC158',
  titleBoss: '\uB545\uCF69 \uBCF4\uC2A4',
  centerTile: '\uC911\uC2EC \uD0C0\uC77C',
  bossHp: '\uBCF4\uC2A4 HP',
  loadingMission: '\uBBF8\uC158 \uB85C\uB529 \uC911...',
  defeated: '\uBCF4\uC2A4 \uCC98\uCE58 \uC644\uB8CC',
  hitting: '\uD0C0\uACA9 \uC911...',
  tapAttack: '\uB545\uCF69\uC744 \uD0ED\uD574\uC11C \uACF5\uACA9',
  session: '\uC138\uC158 \uC0C1\uD0DC',
  clicksLeft: '\uB0A8\uC740 \uD074\uB9AD',
  coopHint:
    '\uAC19\uC740 \uD559\uAD50 \uC720\uC800\uAC00 \uD568\uAED8 \uACF5\uACA9\uD558\uBA74 \uBCF4\uC2A4\uB97C \uB354 \uBE68\uB9AC \uCC98\uCE58\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  attack: '\uACF5\uACA9',
  close: '\uB2EB\uAE30',
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return '/'
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function getPeanutImagePath(bossState) {
  const base = normalizeBaseUrl(import.meta.env.BASE_URL)
  const hp = toNumber(bossState?.current_hp, 0)
  const maxHp = Math.max(1, toNumber(bossState?.max_hp, 1))

  if (hp <= 0) return `${base}images/peanut_fairy.png`

  const ratio = hp / maxHp
  if (ratio <= 0.2) return `${base}images/crack4.png`
  if (ratio <= 0.4) return `${base}images/crack3.png`
  if (ratio <= 0.6) return `${base}images/crack2.png`
  if (ratio <= 0.8) return `${base}images/crack1.png`
  return `${base}images/peanut_full_nobg.png`
}

function formatError(error, fallback = K.requestFail) {
  return error?.response?.data?.detail || error?.message || fallback
}

function wsBadgeMeta(status) {
  switch (status) {
    case 'live':
      return { label: K.wsLive, className: 'bg-emerald-500/20 text-emerald-100' }
    case 'connecting':
      return { label: K.wsConnecting, className: 'bg-amber-500/20 text-amber-100' }
    case 'error':
      return { label: K.wsError, className: 'bg-rose-500/20 text-rose-100' }
    case 'closed':
      return { label: K.wsClosed, className: 'bg-slate-500/20 text-slate-100' }
    default:
      return { label: K.wsIdle, className: 'bg-slate-500/20 text-slate-100' }
  }
}

export default function PeanutMax({ open, tile, onClose, onCaptureSuccess }) {
  const navigate = useNavigate()
  const user = useGameStore((state) => state.user)
  const claimSpecialMission = useClaimSpecialMission()

  const socketRef = useRef(null)
  const sessionIdRef = useRef('')
  const claimOnceRef = useRef(false)
  const burstTimersRef = useRef([])

  const [loading, setLoading] = useState(false)
  const [hitting, setHitting] = useState(false)
  const [wsStatus, setWsStatus] = useState('idle')
  const [sessionStatus, setSessionStatus] = useState('READY')
  const [bossState, setBossState] = useState(null)
  const [remainingClicks, setRemainingClicks] = useState(null)
  const [message, setMessage] = useState('')
  const [specialType, setSpecialType] = useState('3x3')
  const [hitFxKey, setHitFxKey] = useState(0)
  const [hitBursts, setHitBursts] = useState([])

  const centerGridId = useMemo(() => {
    if (!tile) return ''
    return tile.special_center_grid_id || tile.grid_id || ''
  }, [tile])

  const hp = toNumber(bossState?.current_hp, 0)
  const maxHp = Math.max(1, toNumber(bossState?.max_hp, 1))
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const isDefeated = hp <= 0

  const canAttack =
    open &&
    Boolean(user?.id) &&
    !loading &&
    !hitting &&
    wsStatus === 'live' &&
    !isDefeated &&
    toNumber(remainingClicks, 1) > 0 &&
    sessionIdRef.current.length > 0

  const peanutImageSrc = useMemo(() => getPeanutImagePath(bossState), [bossState])
  const wsMeta = useMemo(() => wsBadgeMeta(wsStatus), [wsStatus])

  const closeSocket = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }

    socketRef.current = null
  }, [])

  const clearBurstTimers = useCallback(() => {
    burstTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    burstTimersRef.current = []
  }, [])

  const spawnHitBurst = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const damage = Math.max(1, toNumber(bossState?.damage_per_hit, 1))
    const offsets = [-56, -34, -14, 8, 30, 52]
    const offset = offsets[Math.floor(Math.random() * offsets.length)]

    setHitBursts((prev) => [...prev, { id, damage, offset }].slice(-10))

    const timerId = window.setTimeout(() => {
      setHitBursts((prev) => prev.filter((item) => item.id !== id))
    }, 520)
    burstTimersRef.current.push(timerId)
  }, [bossState?.damage_per_hit])

  const handleClaim = useCallback(async () => {
    if (claimOnceRef.current) return
    if (!centerGridId || !sessionIdRef.current || !user?.id) return

    claimOnceRef.current = true
    setMessage(K.claimApplying)

    try {
      const response = await claimSpecialMission.mutateAsync({
        gridId: centerGridId,
        sessionId: sessionIdRef.current,
        userId: user.id,
      })

      const captureApplied = Boolean(response?.capture_applied)
      const captureTileCount = toNumber(response?.capture_tile_count, 0)

      console.log('[PeanutMax] claim result:', {
        centerGridId,
        captureApplied,
        captureTileCount,
      })

      setMessage(
        captureApplied
          ? `${K.captureSuccessPrefix}${captureTileCount}${K.captureSuccessSuffix}`
          : response?.message || K.captureAlready
      )

      onCaptureSuccess?.({
        centerGridId,
        captureApplied,
        captureTileCount,
        specialType: response?.special_type || specialType,
      })

      window.setTimeout(() => {
        onClose?.()
      }, 450)
    } catch (error) {
      claimOnceRef.current = false
      setMessage(formatError(error, K.claimFailed))
      setWsStatus('error')
    }
  }, [centerGridId, claimSpecialMission, onCaptureSuccess, onClose, specialType, user?.id])

  const handleAttack = useCallback(() => {
    const socket = socketRef.current
    const sessionId = sessionIdRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId || !user?.id) return

    setHitting(true)
    setHitFxKey((prev) => prev + 1)
    spawnHitBurst()

    socket.send(
      JSON.stringify({
        type: 'boss_hit',
        session_id: sessionId,
        user_key: String(user.id),
      })
    )
  }, [spawnHitBurst, user?.id])

  useEffect(() => {
    if (!open) {
      closeSocket()
      clearBurstTimers()
      claimOnceRef.current = false
      sessionIdRef.current = ''
      setLoading(false)
      setHitting(false)
      setWsStatus('idle')
      setSessionStatus('READY')
      setBossState(null)
      setRemainingClicks(null)
      setMessage('')
      setHitBursts([])
      return
    }

    if (!centerGridId) {
      setMessage(K.invalidCenter)
      return
    }

    if (!user?.id) {
      onClose?.()
      navigate('/auth')
      return
    }

    let cancelled = false
    claimOnceRef.current = false
    sessionIdRef.current = ''

    setLoading(true)
    setHitting(false)
    setWsStatus('connecting')
    setSessionStatus('READY')
    setBossState(null)
    setRemainingClicks(null)
    setMessage(K.connectingRoom)

    startTileGameSession(centerGridId, { userKey: String(user.id) })
      .then((session) => {
        if (cancelled) return

        sessionIdRef.current = session.session_id
        setSessionStatus(session.session_status || 'READY')
        setSpecialType(
          session?.config?.special_type ||
            tile?.special_type ||
            tile?.special_zone_type ||
            '3x3'
        )

        if (session?.boss_state) {
          setBossState(session.boss_state)
          if (toNumber(session.boss_state.current_hp, 1) <= 0) {
            setMessage(K.alreadyDefeated)
          }
        }

        closeSocket()
        const socket = createBossGameSocket(centerGridId)
        socketRef.current = socket

        socket.onopen = () => {
          if (cancelled) return
          setWsStatus('live')
          setMessage(K.connected)
          socket.send(JSON.stringify({ type: 'sync' }))
        }

        socket.onmessage = (event) => {
          if (cancelled) return

          let payload = null
          try {
            payload = JSON.parse(event.data)
          } catch {
            return
          }

          if (payload?.type === 'boss_state' && payload?.boss_state) {
            setBossState(payload.boss_state)
            if (payload?.session_status) setSessionStatus(payload.session_status)
            if (toNumber(payload.boss_state.current_hp, 1) <= 0) {
              void handleClaim()
            }
            return
          }

          if (payload?.type === 'boss_hit_ack') {
            setHitting(false)

            if (payload?.session_status) setSessionStatus(payload.session_status)
            if (payload?.boss_state) setBossState(payload.boss_state)
            if (Number.isFinite(Number(payload?.remaining_clicks))) {
              setRemainingClicks(Number(payload.remaining_clicks))
            }

            if (!payload?.success) {
              setMessage(payload?.message || K.attackRejected)
              return
            }

            setMessage(K.hitSuccess)

            if (payload?.can_claim || toNumber(payload?.boss_state?.current_hp, 1) <= 0) {
              void handleClaim()
            }
          }
        }

        socket.onerror = () => {
          if (cancelled) return
          setWsStatus('error')
          setHitting(false)
          setMessage(K.socketError)
        }

        socket.onclose = () => {
          if (cancelled) return
          setWsStatus('closed')
          setHitting(false)
        }
      })
      .catch((error) => {
        if (cancelled) return
        setWsStatus('error')
        setMessage(formatError(error, K.startFailed))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
      closeSocket()
      clearBurstTimers()
      setHitting(false)
      setHitBursts([])
    }
  }, [centerGridId, clearBurstTimers, closeSocket, handleClaim, navigate, onClose, open, tile, user?.id])

  useEffect(() => {
    return () => {
      clearBurstTimers()
    }
  }, [clearBurstTimers])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[92] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[93] mx-auto w-full max-w-[430px] rounded-t-3xl border border-amber-200/20 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 pb-7 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 290 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/25" />

            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/90">{K.titleMission}</p>
                <h2 className="mt-1 truncate text-lg font-black text-white">{K.titleBoss} {specialType}</h2>
                <p className="mt-1 truncate text-[11px] font-medium text-slate-300">{K.centerTile}: {centerGridId}</p>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${wsMeta.className}`}>
                {wsMeta.label}
              </span>
            </div>

            <div className="rounded-2xl border border-rose-300/20 bg-rose-950/30 p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-rose-50">
                <span>{K.bossHp}</span>
                <span>{hp} / {maxHp}</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-rose-950/70">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 via-rose-400 to-red-500"
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                />
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleAttack}
              disabled={!canAttack}
              whileTap={canAttack ? { scale: 0.97 } : undefined}
              className="relative mt-4 w-full rounded-3xl border border-white/20 bg-white/5 p-5 text-center disabled:cursor-not-allowed disabled:opacity-45"
            >
              <motion.img
                key={`peanut-${peanutImageSrc}-${hitFxKey}`}
                src={peanutImageSrc}
                alt="peanut-boss"
                initial={{ scale: 1, rotate: 0, y: 0 }}
                animate={{ scale: [1, 0.94, 1.06, 1], rotate: [0, -3, 3, 0], y: [0, -2, 0] }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="mx-auto h-[170px] w-[170px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
              />

              <AnimatePresence>
                {hitting && (
                  <motion.div
                    key={`flash-${hitFxKey}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    className="pointer-events-none absolute inset-0 rounded-3xl bg-amber-200/30 mix-blend-screen"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {hitBursts.map((burst) => (
                  <motion.div
                    key={burst.id}
                    initial={{ opacity: 0, y: 6, scale: 0.75, x: burst.offset }}
                    animate={{ opacity: 1, y: -18, scale: 1.05, x: burst.offset }}
                    exit={{ opacity: 0, y: -40, scale: 0.96, x: burst.offset }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-black text-white"
                  >
                    +{burst.damage}
                  </motion.div>
                ))}
              </AnimatePresence>

              <p className="mt-2 text-sm font-extrabold text-white">
                {loading ? K.loadingMission : isDefeated ? K.defeated : hitting ? K.hitting : K.tapAttack}
              </p>
            </motion.button>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs text-slate-100">
                {K.session}: <span className="font-bold">{sessionStatus}</span>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs text-slate-100">
                {K.clicksLeft}: <span className="font-bold">{remainingClicks == null ? '-' : remainingClicks}</span>
              </div>
            </div>

            <p className="mt-3 min-h-[20px] text-xs font-medium text-amber-100/90">{message || K.coopHint}</p>

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={handleAttack}
                disabled={!canAttack}
                className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-rose-950/50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isDefeated ? K.defeated : hitting ? K.hitting : K.attack}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white/90"
              >
                {K.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
