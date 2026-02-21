/**
 * pages/AuthPage.jsx
 * ──────────────────
 * 회원가입 +인증
 * Landing → Login / Signup 4단계 → Done
 *
 * 컬러칩:
 *   --warm-1: #FDCC80  (밝은 황금)
 *   --warm-2: #EBB865  (황금)
 *   --warm-3: #DAAC5D  (어스 골드)
 *   --coral-1: #E79380 (밝은 코랄)
 *   --coral-2: #DF7E66 (코랄)
 *
 * 기능·백엔드 연결 100% 원본 유지.
 * 컨테이너 기준: max-w-[430px] (App.jsx 동일)
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { sendAuthCode, verifyAuthCode, signUpUser, loginUser } from '../lib/api'

// ─── 뷰 상수 ────────────────────────────────────────────────
const V = {
  LANDING:    'landing',
  LOGIN:      'login',
  S_EMAIL:    'signup-email',
  S_CODE:     'signup-code',
  S_PROFILE:  'signup-profile',
  S_PASSWORD: 'signup-password',
  DONE:       'done',
}

const BACK_MAP = {
  [V.LOGIN]:      V.LANDING,
  [V.S_EMAIL]:    V.LANDING,
  [V.S_CODE]:     V.S_EMAIL,
  [V.S_PROFILE]:  V.S_CODE,
  [V.S_PASSWORD]: V.S_PROFILE,
}

const PROGRESS = {
  [V.S_EMAIL]:    25,
  [V.S_CODE]:     50,
  [V.S_PROFILE]:  75,
  [V.S_PASSWORD]: 100,
}

// 슬라이드 트랜지션
const slide = {
  enter: (dir) => ({ x: dir >= 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 320 } },
  exit:   (dir) => ({ x: dir >= 0 ? -72 : 72, opacity: 0, transition: { duration: 0.12 } }),
}

function apiErr(e) {
  return e?.response?.data?.detail || e?.message || '오류가 발생했습니다.'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AuthPage (메인)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AuthPage() {
  const navigate = useNavigate()
  const user    = useGameStore((s) => s.user)
  const setUser = useGameStore((s) => s.setUser)

  const [view,     setView]    = useState(V.LANDING)
  const [dir,      setDir]     = useState(1)
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)
  const [showPw,   setShowPw]  = useState(false)

  // 폼 필드
  const [email,           setEmail]           = useState('')
  const [code,            setCode]            = useState('')
  const [nickname,        setNickname]        = useState('')
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [university,      setUniversity]      = useState('')
  const [devCode,         setDevCode]         = useState('')

  const primaryRef = useRef(null)

  // 이미 로그인 → 홈
  useEffect(() => {
    if (user && view === V.LANDING) navigate('/', { replace: true })
  }, []) // eslint-disable-line

  // 스텝 전환 시 첫 input 포커스
  useEffect(() => {
    const id = setTimeout(() => primaryRef.current?.focus(), 260)
    return () => clearTimeout(id)
  }, [view])

  // Done → 자동 홈 이동
  useEffect(() => {
    if (view !== V.DONE) return
    const id = setTimeout(() => navigate('/', { replace: true }), 2400)
    return () => clearTimeout(id)
  }, [view, navigate])

  const goTo   = useCallback((v) => { setDir(1);  setError(''); setView(v) }, [])
  const goBack = useCallback(() => { setDir(-1); setError(''); setView((c) => BACK_MAP[c] || V.LANDING) }, [])

  // ── API 핸들러 ────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await sendAuthCode(email.trim())
      setUniversity(res.university || '')
      if (res.dev_code) setDevCode(res.dev_code)
      goTo(V.S_CODE)
    } catch (e) { setError(apiErr(e)) } finally { setLoading(false) }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) { setError('인증 코드를 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await verifyAuthCode(email.trim(), code.trim())
      setUniversity(res.university || university)
      goTo(V.S_PROFILE)
    } catch (e) { setError(apiErr(e)) } finally { setLoading(false) }
  }

  const handleGoToPassword = () => {
    if (nickname.trim().length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return }
    goTo(V.S_PASSWORD)
  }

  const handleSignup = async () => {
    if (password.length < 4)          { setError('비밀번호는 4자 이상이어야 합니다.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true); setError('')
    try {
      const res = await signUpUser({ email: email.trim(), nickname: nickname.trim(), password })
      setUser({ id: res.user.id, nickname: res.user.nickname, university: res.user.university })
      goTo(V.DONE)
    } catch (e) { setError(apiErr(e)) } finally { setLoading(false) }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 모두 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      const res = await loginUser({ email: email.trim(), password })
      setUser({ id: res.user.id, nickname: res.user.nickname, university: res.user.university })
      navigate('/', { replace: true })
    } catch (e) { setError(apiErr(e)) } finally { setLoading(false) }
  }

  const enter = (e, fn) => { if (e.key === 'Enter') { e.preventDefault(); fn() } }

  // ── 뷰 렌더 ──────────────────────────────────────────────
  const renderView = () => {
    switch (view) {

      /* ━━━ LANDING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.LANDING: return (
        <div className="flex flex-col h-full">

          {/* 상단 히어로 */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">

            {/* 앱 아이콘 */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 160 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                {/* 글로우 링 */}
                <div className="absolute inset-0 rounded-[2rem] blur-2xl scale-110 opacity-40"
                  style={{ background: 'radial-gradient(circle, #FDCC80, #DF7E66)' }} />
                {/* 아이콘 */}
                <div className="relative w-[100px] h-[100px] rounded-[2rem] flex items-center justify-center text-5xl"
                  style={{
                    background: 'linear-gradient(145deg, #FDCC80 0%, #EBB865 50%, #DF7E66 100%)',
                    boxShadow: '0 16px 48px rgba(223,126,102,0.40), inset 0 1px 0 rgba(255,255,255,0.35)',
                  }}>
                  🗺️
                </div>
              </motion.div>
            </motion.div>

            {/* 타이틀 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-7 text-center"
            >
              <h1 className="text-[2rem] font-black tracking-tight leading-[1.2]"
                style={{ color: '#1C1009' }}>
                Campus
                <br />
                <span style={{
                  background: 'linear-gradient(90deg, #EBB865, #DF7E66)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Turf War
                </span>
              </h1>
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500 max-w-[230px] mx-auto">
                30m 격자로 캠퍼스 주변을 점령하고<br />우리 학교의 영토를 넓혀보세요
              </p>
            </motion.div>

            {/* 피처 칩 3개 */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="mt-8 flex gap-2.5"
            >
              {[
                { emoji: '📍', label: '실시간 점령' },
                { emoji: '🏆', label: '대학 랭킹' },
                { emoji: '🎯', label: '미션 도전' },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.32 + i * 0.06 }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl px-3.5 py-3 border"
                  style={{
                    background:  'rgba(253,204,128,0.10)',
                    borderColor: 'rgba(235,184,101,0.28)',
                  }}
                >
                  <span className="text-[22px]">{f.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-500">{f.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* 하단 CTA */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="px-6 pb-10 space-y-3"
          >
            <WarmButton onClick={() => goTo(V.S_EMAIL)}>
              시작하기
            </WarmButton>
            <OutlineButton onClick={() => goTo(V.LOGIN)}>
              이미 계정이 있어요
            </OutlineButton>
          </motion.div>

        </div>
      )

      /* ━━━ LOGIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.LOGIN: return (
        <StepShell onBack={goBack}>
          <Heading title="다시 오셨군요!" sub="이메일과 비밀번호로 로그인하세요" />

          <div className="mt-8 space-y-3">
            <ErrorBanner message={error} />
            <TextInput
              ref={primaryRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => enter(e, handleLogin)}
              placeholder="학교 이메일"
            />
            <PasswordInput
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => enter(e, handleLogin)}
              placeholder="비밀번호"
              show={showPw}
              onToggle={() => setShowPw(!showPw)}
            />
          </div>

          <BottomArea>
            <WarmButton onClick={handleLogin} loading={loading}>로그인</WarmButton>
            <LinkText onClick={() => { setPassword(''); goTo(V.S_EMAIL) }}>
              계정이 없으신가요? <u>회원가입</u>
            </LinkText>
          </BottomArea>
        </StepShell>
      )

      /* ━━━ SIGNUP 1 — 이메일 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.S_EMAIL: return (
        <StepShell onBack={goBack} progress={PROGRESS[view]}>
          <Heading
            title={'학교 이메일을\n입력해주세요'}
            sub=".ac.kr 이메일로 학교를 인증해요"
          />

          <div className="mt-8 space-y-3">
            <ErrorBanner message={error} />
            <TextInput
              ref={primaryRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => enter(e, handleSendCode)}
              placeholder="name@university.ac.kr"
            />
          </div>

          <BottomArea>
            <WarmButton onClick={handleSendCode} loading={loading}>인증 코드 받기</WarmButton>
          </BottomArea>
        </StepShell>
      )

      /* ━━━ SIGNUP 2 — 코드 인증 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.S_CODE: return (
        <StepShell onBack={goBack} progress={PROGRESS[view]}>
          <Heading
            title={'인증 코드를\n입력해주세요'}
            sub={
              <span>
                {university
                  ? <span className="font-bold" style={{ color: '#B8710A' }}>{university}</span>
                  : '이메일'}로 발송된 6자리 코드
              </span>
            }
          />

          <div className="mt-8 space-y-3">
            <ErrorBanner message={error} />

            {/* 숫자 코드 인풋 — 크게 */}
            <CodeInput
              ref={primaryRef}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={(e) => enter(e, handleVerifyCode)}
            />

            {/* DEV 모드 힌트 */}
            {devCode && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl px-5 py-3.5 text-center"
                style={{
                  background:  'rgba(253,204,128,0.18)',
                  border:      '1px solid rgba(235,184,101,0.35)',
                }}
              >
                <p className="text-[10px] font-black tracking-widest uppercase"
                  style={{ color: '#B8710A' }}>Dev Mode</p>
                <p className="mt-1 text-2xl font-black tracking-[0.35em]"
                  style={{ color: '#7A4800' }}>{devCode}</p>
              </motion.div>
            )}
          </div>

          <BottomArea>
            <WarmButton onClick={handleVerifyCode} loading={loading}>확인</WarmButton>
          </BottomArea>
        </StepShell>
      )

      /* ━━━ SIGNUP 3 — 닉네임 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.S_PROFILE: return (
        <StepShell onBack={goBack} progress={PROGRESS[view]}>
          <Heading
            title={'닉네임을\n정해주세요'}
            sub="게임에서 사용할 이름이에요"
          />

          <div className="mt-8 space-y-3">
            <ErrorBanner message={error} />
            <div className="relative">
              <TextInput
                ref={primaryRef}
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError('') }}
                onKeyDown={(e) => enter(e, handleGoToPassword)}
                placeholder="2~30자 닉네임"
                maxLength={30}
                style={{ paddingRight: '3.5rem' }}
              />
              {/* 글자 수 카운터 */}
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-300">
                {nickname.length}/30
              </span>
            </div>

            {/* 인증된 대학교 뱃지 */}
            {university && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 rounded-2xl px-5 py-3.5"
                style={{
                  background:  'rgba(253,204,128,0.14)',
                  border:      '1px solid rgba(235,184,101,0.30)',
                }}
              >
                <span className="text-xl">🏫</span>
                <span className="text-[14px] font-bold" style={{ color: '#B8710A' }}>{university}</span>
                <span className="ml-auto text-[18px]" style={{ color: '#EBB865' }}>✓</span>
              </motion.div>
            )}
          </div>

          <BottomArea>
            <WarmButton onClick={handleGoToPassword}>다음</WarmButton>
          </BottomArea>
        </StepShell>
      )

      /* ━━━ SIGNUP 4 — 비밀번호 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.S_PASSWORD: return (
        <StepShell onBack={goBack} progress={PROGRESS[view]}>
          <Heading
            title={'비밀번호를\n설정해주세요'}
            sub="다음 로그인 시 사용할 비밀번호예요"
          />

          <div className="mt-8 space-y-3">
            <ErrorBanner message={error} />
            <PasswordInput
              ref={primaryRef}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              onKeyDown={(e) => enter(e, handleSignup)}
              placeholder="비밀번호 (4자 이상)"
              show={showPw}
              onToggle={() => setShowPw(!showPw)}
            />
            <PasswordInput
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setError('') }}
              onKeyDown={(e) => enter(e, handleSignup)}
              placeholder="비밀번호 확인"
              show={showPw}
              onToggle={() => setShowPw(!showPw)}
            />

            {/* 일치 여부 */}
            <AnimatePresence>
              {password && passwordConfirm && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-[12px] font-bold overflow-hidden"
                  style={{ color: password === passwordConfirm ? '#22c55e' : '#ef4444' }}
                >
                  {password === passwordConfirm ? '✓ 비밀번호가 일치합니다' : '✕ 비밀번호가 일치하지 않습니다'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <BottomArea>
            <WarmButton
              onClick={handleSignup}
              loading={loading}
              disabled={password !== passwordConfirm || password.length < 4}
            >
              가입 완료
            </WarmButton>
          </BottomArea>
        </StepShell>
      )

      /* ━━━ DONE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      case V.DONE: return (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center">

          {/* 체크 원 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 11, stiffness: 160 }}
            className="w-[112px] h-[112px] rounded-full flex items-center justify-center"
            style={{
              background:  'linear-gradient(145deg, #FDCC80, #DF7E66)',
              boxShadow:   '0 20px 56px rgba(223,126,102,0.40)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </motion.div>

          {/* 텍스트 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 space-y-2"
          >
            <h1 className="text-[1.8rem] font-black tracking-tight" style={{ color: '#1C1009' }}>
              환영합니다!
            </h1>
            <p className="text-[15px] text-slate-500 leading-relaxed">
              <span className="font-bold" style={{ color: '#B8710A' }}>{nickname}</span>
              님, 지도를 점령하러 가볼까요?
            </p>
            {university && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 mt-1"
                style={{
                  background:  'rgba(253,204,128,0.18)',
                  border:      '1px solid rgba(235,184,101,0.35)',
                }}
              >
                <span>🏫</span>
                <span className="text-[13px] font-bold" style={{ color: '#B8710A' }}>{university}</span>
              </motion.div>
            )}
          </motion.div>

          {/* 버튼 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 w-full"
          >
            <WarmButton onClick={() => navigate('/', { replace: true })}>
              지도로 가기
            </WarmButton>
          </motion.div>
        </div>
      )

      default: return null
    }
  }

  // ── 루트 렌더 ─────────────────────────────────────────────
  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" style={{ background: '#FDF9F4' }}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={view}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          className="min-h-full flex flex-col"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  서브 컴포넌트 — 모듈 레벨 (리렌더 시 재생성 안 됨)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * StepShell
 * 스텝 공통 레이아웃: 뒤로가기 + 프로그레스 바 + 콘텐츠 영역
 */
function StepShell({ children, onBack, progress }) {
  return (
    <div className="flex flex-col h-full">

      {/* 프로그레스 바 — 최상단 고정 */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'rgba(235,184,101,0.18)' }}>
          <motion.div
            className="h-full rounded-r-full"
            style={{ background: 'linear-gradient(90deg, #EBB865, #DF7E66)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* 뒤로가기 버튼 */}
      {onBack && (
        <div className="pt-12 px-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors active:bg-black/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* 콘텐츠 — 플렉스 성장 */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        {children}
      </div>
    </div>
  )
}

/**
 * Heading
 * 스텝 제목 + 서브텍스트
 */
function Heading({ title, sub }) {
  return (
    <div className="space-y-2">
      <h1
        className="whitespace-pre-line text-[1.7rem] font-black leading-[1.25] tracking-tight"
        style={{ color: '#1C1009' }}
      >
        {title}
      </h1>
      <p className="text-[14px] font-medium text-slate-400 leading-relaxed">{sub}</p>
    </div>
  )
}

/**
 * BottomArea
 * 하단 CTA 영역 — mt-auto 으로 항상 아래에 붙음
 */
function BottomArea({ children }) {
  return (
    <div className="mt-auto pb-10 pt-6 space-y-3">
      {children}
    </div>
  )
}

/**
 * WarmButton
 * 황금-코랄 그라데이션 주요 버튼
 */
function WarmButton({ onClick, loading, disabled, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 rounded-2xl text-[15px] font-bold transition-all disabled:opacity-40 disabled:shadow-none"
      style={{
        background:  'linear-gradient(135deg, #FDCC80 0%, #EBB865 45%, #DF7E66 100%)',
        boxShadow:   '0 8px 24px rgba(235,184,101,0.38)',
        color:       '#5C3100',
      }}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  )
}

/**
 * OutlineButton
 * 테두리형 보조 버튼
 */
function OutlineButton({ onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full h-14 rounded-2xl text-[14px] font-bold border-2 transition-all"
      style={{
        borderColor: 'rgba(218,172,93,0.45)',
        color:       '#8A5E14',
        background:  'transparent',
      }}
    >
      {children}
    </motion.button>
  )
}

/**
 * LinkText
 * 텍스트 링크 버튼
 */
function LinkText({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 text-[13px] font-semibold text-center"
      style={{ color: '#B8710A' }}
    >
      {children}
    </button>
  )
}

/**
 * TextInput
 * 공통 텍스트 인풋 (focus 시 황금 테두리)
 */
const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      ref={ref}
      {...props}
      onFocus={(e) => { setFocused(true);  props.onFocus?.(e) }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e)  }}
      className="w-full h-14 rounded-2xl border-2 px-5 text-[15px] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300"
      style={{
        background:  focused ? '#FFFFFF' : '#FAF6F0',
        borderColor: focused ? '#EBB865' : '#EDE8E0',
        boxShadow:   focused ? '0 0 0 4px rgba(235,184,101,0.14)' : 'none',
        ...style,
      }}
    />
  )
})

/**
 * CodeInput
 * 6자리 숫자 인증 코드 전용 인풋 (크게, 중앙 정렬, 트래킹)
 */
const CodeInput = forwardRef(function CodeInput({ value, onChange, onKeyDown }, ref) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="000000"
      className="w-full h-[68px] rounded-2xl border-2 text-center text-[1.75rem] font-black outline-none transition-all"
      style={{
        background:      focused ? '#FFFFFF' : '#FAF6F0',
        borderColor:     value.length === 6 ? '#EBB865' : focused ? '#EBB865' : '#EDE8E0',
        boxShadow:       focused ? '0 0 0 4px rgba(235,184,101,0.14)' : 'none',
        letterSpacing:   '0.4em',
        color:           '#1C1009',
        caretColor:      '#EBB865',
      }}
    />
  )
})

/**
 * PasswordInput
 * 비밀번호 인풋 + 눈 아이콘 토글
 */
const PasswordInput = forwardRef(function PasswordInput(
  { value, onChange, onKeyDown, placeholder, show, onToggle },
  ref
) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full h-14 rounded-2xl border-2 px-5 pr-14 text-[15px] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300"
        style={{
          background:  focused ? '#FFFFFF' : '#FAF6F0',
          borderColor: focused ? '#EBB865' : '#EDE8E0',
          boxShadow:   focused ? '0 0 0 4px rgba(235,184,101,0.14)' : 'none',
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors"
        style={{ color: focused ? '#EBB865' : '#CBD5E1' }}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
})

/**
 * ErrorBanner
 * 오류 메시지 — 애니메이션 높이 펼침
 */
function ErrorBanner({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div
            className="mb-1 rounded-2xl px-5 py-3.5 text-[13px] font-semibold"
            style={{
              background:  'rgba(231,147,128,0.12)',
              color:       '#B54030',
              border:      '1px solid rgba(223,126,102,0.22)',
            }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Spinner
 * 로딩 스피너
 */
function Spinner() {
  return (
    <svg className="mx-auto h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg"
      fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#5C3100" strokeWidth="4" />
      <path className="opacity-75" fill="#5C3100" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/** 눈 아이콘 */
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/** 눈 가린 아이콘 */
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}