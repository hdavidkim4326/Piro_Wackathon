/**
 * 전체 화면 인증 페이지 (Toss 스타일 퍼널)
 * ────────────────────────────────────────
 * Landing → Login / Signup 4-step funnel → Done
 *
 * [버그 수정]
 *  - 모든 서브 컴포넌트를 모듈 레벨로 분리하여
 *    렌더마다 새 함수가 생성되는 인라인 컴포넌트 안티패턴 제거.
 *    → input 포커스 유실 · 타이핑 렉 완전 해결.
 *  - max-w-lg 래퍼로 데스크톱 반응형 대응.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { sendAuthCode, verifyAuthCode, signUpUser, loginUser } from '../lib/api'

// ─── 상수 ────────────────────────────────────────────────────
const V = {
  LANDING: 'landing',
  LOGIN: 'login',
  S_EMAIL: 'signup-email',
  S_CODE: 'signup-code',
  S_PROFILE: 'signup-profile',
  S_PASSWORD: 'signup-password',
  DONE: 'done',
}

const BACK_MAP = {
  [V.LOGIN]: V.LANDING,
  [V.S_EMAIL]: V.LANDING,
  [V.S_CODE]: V.S_EMAIL,
  [V.S_PROFILE]: V.S_CODE,
  [V.S_PASSWORD]: V.S_PROFILE,
}

const PROGRESS = {
  [V.S_EMAIL]: 25,
  [V.S_CODE]: 50,
  [V.S_PROFILE]: 75,
  [V.S_PASSWORD]: 100,
}

const slideVariants = {
  enter: (dir) => ({ x: dir >= 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 320 } },
  exit: (dir) => ({ x: dir >= 0 ? -80 : 80, opacity: 0, transition: { duration: 0.12 } }),
}

function errMsg(e) {
  return e?.response?.data?.detail || e?.message || '오류가 발생했습니다.'
}

const inputClass =
  'w-full h-14 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-5 text-base text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/5 placeholder:text-slate-300'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function AuthPage() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const setUser = useGameStore((s) => s.setUser)

  const [view, setView] = useState(V.LANDING)
  const [dir, setDir] = useState(1)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [university, setUniversity] = useState('')
  const [devCode, setDevCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const primaryRef = useRef(null)

  // 이미 로그인 → 홈
  useEffect(() => {
    if (user && view === V.LANDING) navigate('/', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 스텝 전환 시 첫 input에 포커스
  useEffect(() => {
    const id = setTimeout(() => primaryRef.current?.focus(), 250)
    return () => clearTimeout(id)
  }, [view])

  // Done → 자동 홈
  useEffect(() => {
    if (view !== V.DONE) return
    const id = setTimeout(() => navigate('/', { replace: true }), 2200)
    return () => clearTimeout(id)
  }, [view, navigate])

  const goTo = useCallback((v) => { setDir(1); setError(''); setView(v) }, [])
  const goBack = useCallback(() => {
    setDir(-1); setError(''); setView((cur) => BACK_MAP[cur] || V.LANDING)
  }, [])

  // ━━━ API 핸들러 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleSendCode = async () => {
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await sendAuthCode(email.trim())
      setUniversity(res.university || '')
      if (res.dev_code) setDevCode(res.dev_code)
      goTo(V.S_CODE)
    } catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) { setError('인증 코드를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await verifyAuthCode(email.trim(), code.trim())
      setUniversity(res.university || university)
      goTo(V.S_PROFILE)
    } catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  const handleGoToPassword = () => {
    if (nickname.trim().length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return }
    goTo(V.S_PASSWORD)
  }

  const handleSignup = async () => {
    if (password.length < 4) { setError('비밀번호는 4자 이상이어야 합니다.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true); setError('')
    try {
      const res = await signUpUser({ email: email.trim(), nickname: nickname.trim(), password })
      setUser({ id: res.user.id, nickname: res.user.nickname, university: res.user.university })
      goTo(V.DONE)
    } catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 모두 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await loginUser({ email: email.trim(), password })
      setUser({ id: res.user.id, nickname: res.user.nickname, university: res.user.university })
      navigate('/', { replace: true })
    } catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  const onEnter = (e, fn) => { if (e.key === 'Enter') { e.preventDefault(); fn() } }
  const progress = PROGRESS[view] || 0

  // ━━━ 뷰 렌더러 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const renderView = () => {
    switch (view) {

      /* ── 랜딩 ─────────────────────────────────────────── */
      case V.LANDING:
        return (
          <div className="flex min-h-dvh flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-10">
              {/* 배경 격자 */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{
                backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 18, delay: 0.1 }}
                className="relative z-10"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-5xl shadow-2xl shadow-indigo-500/30"
                >
                  🗺️
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 text-center"
              >
                <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-3xl font-black leading-tight tracking-tight text-transparent sm:text-4xl">
                  Campus Turf War
                </h1>
                <p className="mx-auto mt-3 max-w-[280px] text-base font-semibold leading-relaxed text-slate-500 sm:max-w-xs sm:text-lg">
                  30m 격자로 캠퍼스 주변을 점령하고 우리 학교의 영토를 넓혀보세요
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="relative z-10 mt-10 flex gap-3"
              >
                {[
                  { emoji: '📍', label: '실시간 점령' },
                  { emoji: '🏆', label: '대학 랭킹' },
                  { emoji: '🎯', label: '미션 도전' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-4">
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-xs font-bold text-slate-500">{f.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 mx-auto w-full max-w-md space-y-3 px-6 pb-10 pt-4 sm:pb-14"
            >
              <button
                onClick={() => goTo(V.S_EMAIL)}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                회원가입 시작하기
              </button>
              <button
                onClick={() => goTo(V.LOGIN)}
                className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-slate-200 text-base font-bold text-slate-600 transition-all active:scale-[0.98] active:bg-slate-50"
              >
                로그인
              </button>
            </motion.div>
          </div>
        )

      /* ── 로그인 ────────────────────────────────────────── */
      case V.LOGIN:
        return (
          <StepShell onBack={goBack}>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">다시 오셨군요!</h1>
              <p className="text-sm text-slate-400 sm:text-base">이메일과 비밀번호로 로그인하세요</p>
            </div>

            <div className="mt-8 space-y-4 sm:mt-10">
              <ErrorBlock message={error} />
              <input
                ref={primaryRef}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => onEnter(e, handleLogin)}
                placeholder="학교 이메일"
                className={inputClass}
              />
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onKeyDown={(e) => onEnter(e, handleLogin)}
                  placeholder="비밀번호"
                  className={`${inputClass} pr-14`}
                />
                <PwToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
              </div>
            </div>

            <BottomArea>
              <SubmitButton onClick={handleLogin} loading={loading}>로그인</SubmitButton>
              <button onClick={() => { setPassword(''); goTo(V.S_EMAIL) }} className="w-full py-2 text-sm font-semibold text-indigo-500">
                계정이 없으신가요? 회원가입
              </button>
            </BottomArea>
          </StepShell>
        )

      /* ── 가입 1: 이메일 ────────────────────────────────── */
      case V.S_EMAIL:
        return (
          <StepShell onBack={goBack} progress={progress}>
            <div className="space-y-1">
              <h1 className="whitespace-pre-line text-2xl font-extrabold leading-[1.35] text-slate-900 sm:text-3xl">
                {'학교 이메일을\n입력해주세요'}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">학교 인증을 위해 .ac.kr 이메일이 필요해요</p>
            </div>

            <div className="mt-8 space-y-4 sm:mt-10">
              <ErrorBlock message={error} />
              <input
                ref={primaryRef}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => onEnter(e, handleSendCode)}
                placeholder="name@university.ac.kr"
                className={inputClass}
              />
            </div>

            <BottomArea>
              <SubmitButton onClick={handleSendCode} loading={loading}>인증 코드 받기</SubmitButton>
            </BottomArea>
          </StepShell>
        )

      /* ── 가입 2: 코드 확인 ─────────────────────────────── */
      case V.S_CODE:
        return (
          <StepShell onBack={goBack} progress={progress}>
            <div className="space-y-1">
              <h1 className="whitespace-pre-line text-2xl font-extrabold leading-[1.35] text-slate-900 sm:text-3xl">
                {'인증 코드를\n입력해주세요'}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">
                {university ? <span className="font-semibold text-indigo-500">{university}</span> : '이메일'}로 발송된 6자리 코드
              </p>
            </div>

            <div className="mt-8 space-y-4 sm:mt-10">
              <ErrorBlock message={error} />
              <input
                ref={primaryRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={(e) => onEnter(e, handleVerifyCode)}
                placeholder="000000"
                className="w-full h-16 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-5 text-center text-2xl font-bold tracking-[0.4em] text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/5 placeholder:text-slate-200 placeholder:tracking-[0.4em] sm:text-3xl"
              />
              {devCode && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-center">
                  <span className="text-xs font-semibold text-amber-500">DEV MODE</span>
                  <p className="mt-0.5 text-xl font-bold tracking-[0.3em] text-amber-700">{devCode}</p>
                </div>
              )}
            </div>

            <BottomArea>
              <SubmitButton onClick={handleVerifyCode} loading={loading}>확인</SubmitButton>
            </BottomArea>
          </StepShell>
        )

      /* ── 가입 3: 닉네임 ────────────────────────────────── */
      case V.S_PROFILE:
        return (
          <StepShell onBack={goBack} progress={progress}>
            <div className="space-y-1">
              <h1 className="whitespace-pre-line text-2xl font-extrabold leading-[1.35] text-slate-900 sm:text-3xl">
                {'닉네임을\n정해주세요'}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">게임에서 사용할 이름이에요</p>
            </div>

            <div className="mt-8 space-y-4 sm:mt-10">
              <ErrorBlock message={error} />
              <div className="relative">
                <input
                  ref={primaryRef}
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setError('') }}
                  onKeyDown={(e) => onEnter(e, handleGoToPassword)}
                  placeholder="2~30자 닉네임"
                  maxLength={30}
                  className={`${inputClass} pr-16`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-300">
                  {nickname.length}/30
                </span>
              </div>

              {university && (
                <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3.5">
                  <span className="text-lg">🏫</span>
                  <span className="text-sm font-bold text-indigo-600">{university}</span>
                </div>
              )}
            </div>

            <BottomArea>
              <SubmitButton onClick={handleGoToPassword} loading={false}>다음</SubmitButton>
            </BottomArea>
          </StepShell>
        )

      /* ── 가입 4: 비밀번호 ──────────────────────────────── */
      case V.S_PASSWORD:
        return (
          <StepShell onBack={goBack} progress={progress}>
            <div className="space-y-1">
              <h1 className="whitespace-pre-line text-2xl font-extrabold leading-[1.35] text-slate-900 sm:text-3xl">
                {'비밀번호를\n설정해주세요'}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">다음 로그인 시 사용할 비밀번호예요</p>
            </div>

            <div className="mt-8 space-y-4 sm:mt-10">
              <ErrorBlock message={error} />
              <div className="relative">
                <input
                  ref={primaryRef}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onKeyDown={(e) => onEnter(e, handleSignup)}
                  placeholder="비밀번호 (4자 이상)"
                  className={`${inputClass} pr-14`}
                />
                <PwToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); setError('') }}
                onKeyDown={(e) => onEnter(e, handleSignup)}
                placeholder="비밀번호 확인"
                className={inputClass}
              />
              {password && passwordConfirm && (
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${password === passwordConfirm ? 'text-emerald-500' : 'text-rose-400'}`}>
                  <span>{password === passwordConfirm ? '✓' : '✕'}</span>
                  {password === passwordConfirm ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                </p>
              )}
            </div>

            <BottomArea>
              <SubmitButton onClick={handleSignup} loading={loading} disabled={password !== passwordConfirm || password.length < 4}>
                가입 완료
              </SubmitButton>
            </BottomArea>
          </StepShell>
        )

      /* ── 완료 ──────────────────────────────────────────── */
      case V.DONE:
        return (
          <div className="flex min-h-dvh flex-col items-center justify-center px-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 180 }}
              className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">환영합니다!</h1>
              <p className="mt-2 text-base text-slate-400">
                <span className="font-bold text-indigo-500">{nickname}</span>님, 지도를 점령하러 가볼까요?
              </p>
              {university && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-5 py-2">
                  <span>🏫</span>
                  <span className="text-sm font-bold text-indigo-600">{university}</span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10">
              <button onClick={() => navigate('/', { replace: true })} className="rounded-2xl bg-slate-900 px-10 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 sm:text-base">
                지도로 가기
              </button>
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  // ━━━ 루트 렌더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={view}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="min-h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  모듈 레벨 서브 컴포넌트 (안정적인 참조 → 리렌더 시 언마운트 안 됨)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StepShell({ children, onBack, progress }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* 프로그레스 바 */}
      {progress > 0 && (
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-slate-100">
          <motion.div
            className="h-full rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* 뒤로가기 */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-4 top-12 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-slate-100 sm:left-6 sm:top-14"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 px-6 pt-24 sm:px-8 sm:pt-28">
        {children}
      </div>
    </div>
  )
}

function BottomArea({ children }) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-3 px-6 pb-10 pt-4 sm:px-8 sm:pb-14">
      {children}
    </div>
  )
}

function SubmitButton({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

function ErrorBlock({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-4 rounded-2xl bg-rose-50 px-5 py-3.5 text-sm font-medium text-rose-600">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PwToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="mx-auto h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
