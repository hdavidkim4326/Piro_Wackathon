ProfileEdit.jsx
/**
 * pages/ProfileEdit.jsx
 * ─────────────────────
 * 프로필 수정 페이지 (두 번째 사진 참고)
 *
 * 필드:
 *   닉네임        — 변경 가능
 *   대학교        — 읽기 전용 (변경 불가)
 *   메일 주소     — 읽기 전용
 *   새 비밀번호   — 입력하면 변경 (선택)
 *   비밀번호 확인 — 새 비밀번호 입력 시 노출
 *
 * API: PATCH /api/users/me  { user_name?, password? }
 * models.py User: user_name, email, password_hash
 */

import { useState, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { getUnivAsset } from '../lib/univAssets'
import { updateMyProfile } from '../lib/api'

// ─── 포커스 인풋 ─────────────────────────────────────────────
const Field = forwardRef(function Field(
  { label, type = 'text', value, onChange, placeholder, disabled, hint, rightSlot, style },
  ref
) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      {label && (
        <label className="block text-[12px] font-bold text-slate-400 mb-1.5 pl-1 tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-14 rounded-2xl border-2 px-5 text-[15px] font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 disabled:cursor-not-allowed"
          style={{
            background:  disabled ? '#F5F0E8' : focused ? '#FFFFFF' : '#FAF6F0',
            borderColor: disabled ? '#EDE8E0' : focused ? '#EBB865' : '#EDE8E0',
            boxShadow:   (!disabled && focused) ? '0 0 0 4px rgba(235,184,101,0.14)' : 'none',
            color:       disabled ? '#94A3B8' : '#1C1009',
            paddingRight: rightSlot ? '3rem' : undefined,
            ...style,
          }}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 pl-1 text-[11px] font-medium text-slate-400">{hint}</p>
      )}
    </div>
  )
})

// ─── 비밀번호 인풋 ────────────────────────────────────────────
const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [show, setShow] = useState(false)
  return (
    <Field
      {...props}
      ref={ref}
      type={show ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="p-1 transition-colors"
          style={{ color: '#CBD5E1' }}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  )
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ProfileEdit (메인)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ProfileEdit() {
  const navigate = useNavigate()
  const { state, dispatch } = useGame()
  const { user } = state

  const [nickname, setNickname] = useState(user?.nickname   || '')
  const [pw,       setPw]       = useState('')
  const [pwc,      setPwc]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)

  if (!user) return null

  const safeEmail       = user?.email || ''
  const asset           = getUnivAsset(safeEmail)
  const pwChanged       = pw.length > 0
  const pwMatch         = pw === pwc
  const nicknameChanged = nickname.trim() !== user.nickname

  const canSave = (nicknameChanged || pwChanged) && (!pwChanged || (pw.length >= 4 && pwMatch))

  // ── 저장 ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (nickname.trim().length < 2) { setError('닉네임은 2자 이상이어야 합니다.'); return }
    if (pwChanged && pw.length < 4)  { setError('비밀번호는 4자 이상이어야 합니다.'); return }
    if (pwChanged && !pwMatch)        { setError('비밀번호가 일치하지 않습니다.'); return }

    setError(''); setLoading(true)
    try {
      await updateMyProfile({
        ...(nicknameChanged ? { user_name: nickname.trim() } : {}),
        ...(pwChanged        ? { password: pw }               : {}),
      })

      // 로컬 스토어 업데이트
      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          nickname: nickname.trim(),
          ...(pwChanged ? { password: pw } : {}),
        },
      })

      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        navigate(-1) // 마이페이지로 돌아가기
      }, 1200)

    } catch (e) {
      setError(e?.data?.detail || e?.message || '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto pb-10" style={{ background: '#FDF9F4' }}>

      {/* ── 상단 헤더 ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 pt-14 pb-5"
        style={{ background: '#FDF9F4' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors active:bg-black/5 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[1.15rem] font-black tracking-tight" style={{ color: '#1C1009' }}>
          프로필 수정
        </h1>
      </div>

      <div className="px-5 space-y-5">

        {/* ── 저장 완료 토스트 ──────────────────────────────── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: -8,    opacity: 0 }}
              className="flex items-center gap-2.5 rounded-2xl px-5 py-3.5"
              style={{
                background: 'rgba(74,222,128,0.12)',
                border:     '1.5px solid rgba(74,222,128,0.30)',
              }}
            >
              <span className="text-lg">✅</span>
              <span className="text-[13px] font-bold text-emerald-600">저장됐어요!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 에러 배너 ─────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl px-5 py-3.5 text-[13px] font-semibold"
                style={{
                  background: 'rgba(231,147,128,0.12)',
                  color:      '#B54030',
                  border:     '1px solid rgba(223,126,102,0.22)',
                }}
              >
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 읽기 전용 섹션 ──────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-slate-300 mb-3 tracking-widest uppercase pl-1">
            인증 정보 (변경 불가)
          </p>
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: '#F5F0E8', border: '1.5px solid #EDE8E0' }}
          >
            {/* 대학교 */}
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="text-[18px] w-7 text-center flex-shrink-0">🏫</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">대학교</p>
                <p className="text-[14px] font-bold truncate" style={{ color: '#8A5E14' }}>
                  {user.university || asset.name}
                </p>
              </div>
            </div>
            <div className="h-px mx-5" style={{ background: '#E8E2D8' }} />
            {/* 이메일 */}
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="text-[18px] w-7 text-center flex-shrink-0">✉️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">이메일</p>
                <p className="text-[14px] font-bold truncate" style={{ color: '#8A5E14' }}>
                  {safeEmail || '미등록 이메일'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 닉네임 ─────────────────────────────────────────── */}
        <Field
          label="닉네임"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError('') }}
          placeholder="2~30자 닉네임"
          maxLength={30}
          hint="지도에서 표시되는 이름이에요"
          rightSlot={
            <span className="text-[11px] font-semibold text-slate-300 pointer-events-none">
              {nickname.length}/30
            </span>
          }
        />

        {/* ── 비밀번호 변경 섹션 ──────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-slate-300 mb-3 tracking-widest uppercase pl-1">
            비밀번호 변경 (선택)
          </p>

          <div className="space-y-3">
            <PasswordField
              label=""
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError('') }}
              placeholder="새 비밀번호 (4자 이상, 미입력 시 유지)"
            />

            {/* 비밀번호 확인은 새 비밀번호 입력 시에만 표시 */}
            <AnimatePresence>
              {pwChanged && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <PasswordField
                    value={pwc}
                    onChange={(e) => { setPwc(e.target.value); setError('') }}
                    placeholder="새 비밀번호 확인"
                  />
                  {/* 일치 여부 */}
                  {pwc.length > 0 && (
                    <p
                      className="mt-2 pl-1 text-[12px] font-bold"
                      style={{ color: pwMatch ? '#22c55e' : '#ef4444' }}
                    >
                      {pwMatch ? '✓ 비밀번호가 일치합니다' : '✕ 비밀번호가 일치하지 않습니다'}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 저장 버튼 ────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!canSave || loading}
          className="w-full h-14 rounded-2xl text-[15px] font-bold transition-all disabled:opacity-35 disabled:shadow-none"
          style={{
            background:  'linear-gradient(135deg,#FDCC80 0%,#EBB865 45%,#DF7E66 100%)',
            boxShadow:   canSave ? '0 8px 24px rgba(235,184,101,0.35)' : 'none',
            color:       '#5C3100',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#5C3100" strokeWidth="4" />
                <path className="opacity-75" fill="#5C3100" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              저장 중...
            </span>
          ) : '저장하기'}
        </motion.button>
      </div>
    </div>
  )
}

// ─── 아이콘 ───────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
