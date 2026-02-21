/**
 * 마이페이지 (프로필)
 * ─────────────────
 * 비로그인 → /auth로 유도, 로그인 → 프로필 카드 + 로그아웃.
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const MotionDiv = motion.div

export default function Profile() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const logout = useGameStore((s) => s.logout)

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-6">
        <MotionDiv
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg text-4xl">
            🔒
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">로그인이 필요합니다</h2>
          <p className="mt-2 text-sm text-slate-400">학교 이메일로 가입하고 게임을 시작하세요</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-6 rounded-2xl bg-indigo-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
          >
            학교 인증하기
          </button>
        </MotionDiv>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <h1 className="mx-auto max-w-lg text-xl font-bold text-slate-800">마이페이지</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-8">
        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {user.nickname?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold text-slate-800">{user.nickname}</h2>
              <p className="truncate text-sm font-medium text-slate-400">{user.university}</p>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 0.1 }}
          className="mt-4"
        >
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-[15px] font-semibold text-rose-500 transition-colors active:bg-slate-50"
          >
            로그아웃
          </button>
        </MotionDiv>
      </div>
    </div>
  )
}
