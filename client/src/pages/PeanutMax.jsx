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
  captureSuccessPrefix: '\uD2B9\uC218 \uC810\uB839 \uC131\uACF5! ',
  captureSuccessSuffix: '\uCE78 \uBC18\uC601 \uC644\uB8CC',
  captureAlready: '\uC774\uBBF8 \uBC18\uC601\uB41C \uC810\uB839\uC785\uB2C8\uB2E4.',
  claimFailed: '\uC810\uB839 \uBC18\uC601 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  invalidCenter: '\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD2B9\uC218 \uC911\uC2EC \uD0C0\uC77C\uC785\uB2C8\uB2E4.',
  connectingRoom: '\uD2B9\uC218 \uBBF8\uC158 \uBC29\uC5D0 \uC5F0\uACB0 \uC911...',
  alreadyDefeated: '\uC774\uBBF8 \uCC98\uCE58\uB41C \uBCF4\uC2A4\uC785\uB2C8\uB2E4. \uC810\uB839 \uD655\uC778 \uC911...',
  connected: '\uC5F0\uACB0 \uC644\uB8CC! \uD0C0\uACA9\uD558\uBA74 \uBAA8\uB450\uC5D0\uAC8C \uC2E4\uC2DC\uAC04 \uBC18\uC601\uB429\uB2C8\uB2E4.',
  attackRejected: '\uACF5\uACA9 \uC694\uCCAD\uC774 \uAC70\uBD80\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
  hitSuccess: '\uD0C0\uACA9 \uC131\uACF5!',
  socketError: '\uC2E4\uC2DC\uAC04 \uC18C\uCF13 \uC5F0\uACB0 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.',
  startFailed: '\uD2B9\uC218 \uBBF8\uC158 \uC2DC\uC791\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  titleMission: '\uD2B9\uC218 \uBBF8\uC158',
  titleBoss: '\uB545\uCF69 \uBCF4\uC2A4 \uB808\uC774\uB4DC',
  centerTile: '\uC911\uC2EC \uD0C0\uC77C',
  bossHp: '\uBCF4\uC2A4 HP',
  loadingMission: '\uBBF8\uC158 \uB85C\uB529 \uC911...',
  defeated: '\uBCF4\uC2A4 \uCC98\uCE58 \uC644\uB8CC',
  hitting: '\uD0C0\uACA9 \uC911...',
  tapAttack: '\uBCF4\uC2A4 \uD0C0\uACA9',
  session: '\uC138\uC158',
  clicksLeft: '\uB0A8\uC740 \uD074\uB9AD',
  zoneType: '\uC784\uBB34 \uAD6C\uC5ED',
  coopHint:
    '\uAC19\uC740 \uD559\uAD50 \uD300\uC6D0\uC774 \uD568\uAED8 \uD0C0\uACA9\uD558\uBA74 \uB354 \uBE68\uB9AC \uCC98\uCE58\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  attack: '\uD0C0\uACA9',
  close: '\uC774\uD0C8',
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return '/'
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function normalizeSpecialType(value) {
  return value === '5x5' ? '5x5' : '3x3'
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
      return { label: K.wsLive, className: 'bg-[#ff922b]/20 text-[#d9480f] border-[#ff922b]/30' }
    case 'connecting':
      return { label: K.wsConnecting, className: 'bg-amber-100/50 text-amber-600 border-amber-300/30' }
    case 'error':
      return { label: K.wsError, className: 'bg-rose-100/50 text-rose-600 border-rose-300/30' }
    case 'closed':
      return { label: K.wsClosed, className: 'bg-slate-100/50 text-slate-500 border-slate-300/30' }
    default:
      return { label: K.wsIdle, className: 'bg-slate-100/50 text-slate-500 border-slate-300/30' }
  }
}

function sessionLabel(status) {
  if (!status) return 'READY'
  return String(status).toUpperCase()
}

function bossScaleByType(type) {
  return type === '5x5' ? 'h-[220px] w-[220px] sm:h-[320px] sm:w-[320px]' : 'h-[200px] w-[200px] sm:h-[290px] sm:w-[290px]'
}

export default function PeanutMax({ open, tile, onClose, onCaptureSuccess }) {
  const navigate = useNavigate()
  const user = useGameStore((state) => state.user)
  const { mutateAsync: claimSpecialMissionAsync } = useClaimSpecialMission()

  const onCloseRef = useRef(onClose)
  const onCaptureSuccessRef = useRef(onCaptureSuccess)
  const claimSpecialMissionRef = useRef(claimSpecialMissionAsync)
  const specialTypeRef = useRef('3x3')

  const socketRef = useRef(null)
  const sessionIdRef = useRef('')
  const claimOnceRef = useRef(false)
  const fxTimersRef = useRef([])
  const remainingClicksRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [hitting, setHitting] = useState(false)
  const [wsStatus, setWsStatus] = useState('idle')
  const [sessionStatus, setSessionStatus] = useState('READY')
  const [bossState, setBossState] = useState(null)
  const [remainingClicks, setRemainingClicks] = useState(null)
  const [message, setMessage] = useState('')
  const [specialType, setSpecialType] = useState('3x3')
  const [hitFxKey, setHitFxKey] = useState(0)
  const [stageFxKey, setStageFxKey] = useState(0)
  const [hitBursts, setHitBursts] = useState([])
  const [impactRipples, setImpactRipples] = useState([])

  const centerGridId = useMemo(() => {
    if (!tile) return ''
    return tile.special_center_grid_id || tile.grid_id || ''
  }, [tile])

  const requestedSpecialType = useMemo(
    () => normalizeSpecialType(tile?.special_type || tile?.special_zone_type || '3x3'),
    [tile?.special_type, tile?.special_zone_type]
  )

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

  const applySpecialType = useCallback((nextType) => {
    const normalized = normalizeSpecialType(nextType)
    specialTypeRef.current = normalized
    setSpecialType(normalized)
  }, [])

  const updateRemainingClicks = useCallback((nextValue) => {
    const normalized =
      nextValue == null || Number.isNaN(Number(nextValue)) ? null : Math.max(0, Number(nextValue))
    remainingClicksRef.current = normalized
    setRemainingClicks(normalized)
  }, [])

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

  const clearFxTimers = useCallback(() => {
    fxTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    fxTimersRef.current = []
  }, [])

  const pushTimer = useCallback((timerId) => {
    fxTimersRef.current.push(timerId)
  }, [])

  const spawnHitBurst = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const damage = Math.max(1, toNumber(bossState?.damage_per_hit, 1))
    const offsets = [-84, -56, -28, 8, 36, 68]
    const offset = offsets[Math.floor(Math.random() * offsets.length)]

    setHitBursts((prev) => [...prev, { id, damage, offset }].slice(-12))

    const timerId = window.setTimeout(() => {
      setHitBursts((prev) => prev.filter((item) => item.id !== id))
    }, 560)
    pushTimer(timerId)
  }, [bossState?.damage_per_hit, pushTimer])

  const spawnImpactRipple = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setImpactRipples((prev) => [...prev, { id }].slice(-5))

    const timerId = window.setTimeout(() => {
      setImpactRipples((prev) => prev.filter((item) => item.id !== id))
    }, 420)
    pushTimer(timerId)
  }, [pushTimer])

  const handleAttack = useCallback(() => {
    const socket = socketRef.current
    const sessionId = sessionIdRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId || !user?.id) return

    setHitting(true)
    setHitFxKey((prev) => prev + 1)
    setStageFxKey((prev) => prev + 1)
    spawnHitBurst()
    spawnImpactRipple()

    socket.send(
      JSON.stringify({
        type: 'boss_hit',
        session_id: sessionId,
        user_key: String(user.id),
      })
    )
  }, [spawnHitBurst, spawnImpactRipple, user?.id])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    onCaptureSuccessRef.current = onCaptureSuccess
  }, [onCaptureSuccess])

  useEffect(() => {
    claimSpecialMissionRef.current = claimSpecialMissionAsync
  }, [claimSpecialMissionAsync])

  useEffect(() => {
    if (!open) return
    applySpecialType(requestedSpecialType)
  }, [applySpecialType, open, requestedSpecialType])

  useEffect(() => {
    if (open) return

    closeSocket()
    clearFxTimers()
    claimOnceRef.current = false
    sessionIdRef.current = ''
    setLoading(false)
    setHitting(false)
    setWsStatus('idle')
    setSessionStatus('READY')
    setBossState(null)
    updateRemainingClicks(null)
    setMessage('')
    setHitBursts([])
    setImpactRipples([])
    setHitFxKey(0)
    setStageFxKey(0)
  }, [clearFxTimers, closeSocket, open, updateRemainingClicks])

  useEffect(() => {
    if (!open) return

    if (!centerGridId) {
      setMessage(K.invalidCenter)
      return
    }

    if (!user?.id) {
      onCloseRef.current?.()
      navigate('/auth')
      return
    }

    let cancelled = false

    const claimMissionOnce = async () => {
      if (cancelled) return
      if (claimOnceRef.current) return
      if (!centerGridId || !sessionIdRef.current || !user?.id) return

      claimOnceRef.current = true
      setMessage(K.claimApplying)

      try {
        const response = await claimSpecialMissionRef.current({
          gridId: centerGridId,
          sessionId: sessionIdRef.current,
          userId: user.id,
        })

        if (cancelled) return

        const captureApplied = Boolean(response?.capture_applied)
        const captureTileCount = toNumber(response?.capture_tile_count, 0)

        setMessage(
          captureApplied
            ? `${K.captureSuccessPrefix}${captureTileCount}${K.captureSuccessSuffix}`
            : response?.message || K.captureAlready
        )

        onCaptureSuccessRef.current?.({
          centerGridId,
          captureApplied,
          captureTileCount,
          specialType: response?.special_type || specialTypeRef.current,
        })

        const closeTimerId = window.setTimeout(() => {
          onCloseRef.current?.()
        }, 520)
        pushTimer(closeTimerId)
      } catch (error) {
        if (cancelled) return
        claimOnceRef.current = false
        setMessage(formatError(error, K.claimFailed))
        setWsStatus('error')
      }
    }

    claimOnceRef.current = false
    sessionIdRef.current = ''
    closeSocket()
    clearFxTimers()
    setLoading(true)
    setHitting(false)
    setWsStatus('connecting')
    setSessionStatus('READY')
    setBossState(null)
    updateRemainingClicks(null)
    setMessage(K.connectingRoom)
    setHitBursts([])
    setImpactRipples([])
    setHitFxKey(0)
    setStageFxKey(0)

    startTileGameSession(centerGridId, { userKey: String(user.id) })
      .then((session) => {
        if (cancelled) return

        sessionIdRef.current = session.session_id
        setSessionStatus(session.session_status || 'READY')
        applySpecialType(session?.config?.special_type || requestedSpecialType)

        if (session?.boss_state) {
          setBossState(session.boss_state)
          const clickLimit = toNumber(session.boss_state.click_limit_per_user, -1)
          if (clickLimit >= 0) updateRemainingClicks(clickLimit)
          if (toNumber(session.boss_state.current_hp, 1) <= 0) {
            setMessage(K.alreadyDefeated)
            void claimMissionOnce()
          }
        }

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
            const clickLimit = toNumber(payload?.boss_state?.click_limit_per_user, -1)
            if (remainingClicksRef.current == null && clickLimit >= 0) {
              updateRemainingClicks(clickLimit)
            }
            if (toNumber(payload.boss_state.current_hp, 1) <= 0) {
              void claimMissionOnce()
            }
            return
          }

          if (payload?.type !== 'boss_hit_ack') return

          setHitting(false)
          if (payload?.session_status) setSessionStatus(payload.session_status)
          if (payload?.boss_state) setBossState(payload.boss_state)

          if (Number.isFinite(Number(payload?.remaining_clicks))) {
            updateRemainingClicks(Number(payload.remaining_clicks))
          }

          if (!payload?.success) {
            setMessage(payload?.message || K.attackRejected)
            return
          }

          setMessage(K.hitSuccess)

          if (payload?.can_claim || toNumber(payload?.boss_state?.current_hp, 1) <= 0) {
            void claimMissionOnce()
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
      setHitting(false)
    }
  }, [
    applySpecialType,
    centerGridId,
    clearFxTimers,
    closeSocket,
    navigate,
    open,
    pushTimer,
    requestedSpecialType,
    updateRemainingClicks,
    user?.id,
  ])

  useEffect(() => {
    return () => {
      closeSocket()
      clearFxTimers()
    }
  }, [clearFxTimers, closeSocket])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[93] flex items-center justify-center bg-black/40 backdrop-blur-sm sm:p-5"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-[#fff9f0] shadow-2xl sm:max-h-[850px] sm:rounded-[36px]">
            <motion.div
              className="pointer-events-none absolute -top-24 -left-20 z-0 h-80 w-80 rounded-full bg-[#ffd8a8]/40 blur-3xl"
              animate={{ x: [0, 16, -12, 0], y: [0, -8, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute -right-24 top-8 z-0 h-96 w-96 rounded-full bg-[#ffc078]/30 blur-3xl"
              animate={{ x: [0, -20, 12, 0], y: [0, 12, -6, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 flex h-full flex-col px-5 pb-[max(env(safe-area-inset-bottom),28px)] pt-[max(env(safe-area-inset-top),56px)]">
              <div className="rounded-[24px] border-2 border-[#ffe8cc] bg-white px-5 py-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#8d6e63]">{K.titleMission}</p>
                    <h2 className="mt-1 truncate text-[22px] font-black text-[#5d4037]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "1px" }}>{K.titleBoss}</h2>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl bg-[#fff4e6] px-5 py-2.5 text-[14px] font-bold text-[#8d6e63] transition-colors hover:bg-[#ffe8cc] active:scale-95"
                    >
                      {K.close}
                    </button>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] ${wsMeta.className}`}
                    >
                      {wsMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[24px] border-2 border-[#ffe8cc] bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-[14px] font-bold text-[#8d6e63]">
                  <span>{K.bossHp}</span>
                  <span className="text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif", fontSize: "18px" }}>
                    {hp} / {maxHp}
                  </span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-[#fff4e6] border border-[#ffe8cc]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#ffd8a8] to-[#ff922b]"
                    animate={{ width: `${hpPercent}%` }}
                    transition={{ type: 'spring', damping: 22, stiffness: 170 }}
                  />
                </div>
              </div>

              <motion.div
                key={`stage-${stageFxKey}`}
                animate={{ x: [0, -8, 7, -5, 3, 0], y: [0, -2, 2, -1, 0] }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="relative mt-3 flex min-h-[290px] flex-1 items-center justify-center overflow-hidden rounded-[32px] border-2 border-[#ffe8cc] bg-white shadow-md"
              >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-[radial-gradient(ellipse_at_bottom,rgba(255,216,168,0.5),rgba(255,255,255,0)_70%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,244,230,0.8),transparent_60%)]" />

                <motion.img
                  key={`peanut-${peanutImageSrc}-${hitFxKey}`}
                  src={peanutImageSrc}
                  alt="peanut-boss"
                  initial={{ scale: 1, rotate: 0, y: 0 }}
                  animate={{
                    scale: [1, 0.92, 1.08, 1],
                    rotate: [0, -4, 4, 0],
                    y: [0, -6, 0],
                  }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className={`${bossScaleByType(specialType)} object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.62)]`}
                />

                <AnimatePresence>
                  {hitting && (
                    <motion.div
                      key={`flash-${hitFxKey}`}
                      initial={{ opacity: 0.42, scale: 0.94 }}
                      animate={{ opacity: 0, scale: 1.18 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.24 }}
                      className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#ff922b]/30 mix-blend-multiply blur-md"
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {impactRipples.map((ripple) => (
                    <motion.div
                      key={ripple.id}
                      initial={{ opacity: 0.35, scale: 0.7 }}
                      animate={{ opacity: 0, scale: 1.42 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.38, ease: 'easeOut' }}
                      className="pointer-events-none absolute h-64 w-64 rounded-full border-4 border-[#ff922b]/50"
                    />
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {hitBursts.map((burst) => (
                    <motion.div
                      key={burst.id}
                      initial={{ opacity: 0, y: 6, scale: 0.78, x: burst.offset }}
                      animate={{ opacity: 1, y: -24, scale: 1.08, x: burst.offset }}
                      exit={{ opacity: 0, y: -52, scale: 0.94, x: burst.offset }}
                      transition={{ duration: 0.52, ease: 'easeOut' }}
                      className="pointer-events-none absolute left-1/2 top-9 -translate-x-1/2 rounded-full bg-rose-500/95 px-2.5 py-0.5 text-sm font-black text-white shadow-lg shadow-rose-900/50"
                    >
                      -{burst.damage}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-[#ffe8cc] bg-white px-3 py-2 text-center shadow-sm">
                  <div className="text-[11px] font-medium text-[#adb5bd]">{K.zoneType}</div>
                  <div className="mt-0.5 text-[14px] font-bold text-[#5d4037]">{specialType}</div>
                </div>
                <div className="rounded-[16px] border border-[#ffe8cc] bg-white px-3 py-2 text-center shadow-sm">
                  <div className="text-[11px] font-medium text-[#adb5bd]">{K.clicksLeft}</div>
                  <div className="mt-0.5 text-[20px] font-black text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>{remainingClicks == null ? '-' : remainingClicks}</div>
                </div>
              </div>

              <p className="mt-4 min-h-[22px] text-center text-[15px] font-bold text-[#8d6e63] drop-shadow-sm">{message || K.coopHint}</p>

              <motion.button
                type="button"
                onClick={handleAttack}
                disabled={!canAttack}
                whileTap={canAttack ? { scale: 0.96 } : undefined}
                className="mt-4 w-full rounded-[24px] bg-gradient-to-b from-[#ffd8a8] to-[#ff922b] px-4 py-6 text-[26px] font-black text-white shadow-[0_8px_20px_rgba(235,184,101,0.5)] border-b-[6px] border-[#d9480f]/50 disabled:cursor-not-allowed disabled:opacity-45 disabled:border-b-0 active:translate-y-1 active:border-b-0"
                style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "2px" }}
              >
                {loading ? K.loadingMission : isDefeated ? K.defeated : hitting ? K.hitting : K.tapAttack}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
