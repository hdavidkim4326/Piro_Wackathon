/**
 * 마이페이지 (프로필)
 * ─────────────────
 * 비로그인 → /auth로 유도
 * 로그인 → 프로필 + 통계 + 데모 모드 토글 + 로그아웃
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMyStats } from '../hooks/useTiles'
import useGameStore from '../store/gameStore'

const MotionDiv = motion.div

export default function Profile() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const logout = useGameStore((s) => s.logout)
  const demoMode = useGameStore((s) => s.demoMode)
  const setDemoMode = useGameStore((s) => s.setDemoMode)
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useMyStats(user?.id)

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-6">
        <MotionDiv
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-lg">
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

      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-8">
        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5"
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
          transition={{ type: 'spring', damping: 20, delay: 0.04 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
            <p className="text-[11px] font-semibold text-slate-400">내 점령 횟수</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">
              {isStatsLoading ? '...' : (stats?.capture_count ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
            <p className="text-[11px] font-semibold text-slate-400">내 기여도</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">
              {isStatsLoading ? '...' : (stats?.contribution_score ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
            <p className="text-[11px] font-semibold text-slate-400">내가 점령한 고유 칸</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">
              {isStatsLoading ? '...' : (stats?.unique_capture_count ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/[0.04]">
            <p className="text-[11px] font-semibold text-slate-400">우리 학교 점령 칸</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">
              {isStatsLoading ? '...' : (stats?.organization_tile_count ?? 0)}
            </p>
          </div>
        </MotionDiv>

        {isStatsError && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-500">
            통계 데이터를 불러오지 못했습니다.
          </div>
        )}

        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 0.08 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-900/5"
        >
          <button
            onClick={() => setDemoMode(!demoMode)}
            className="flex w-full items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                demoMode ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400'
              }`}>
                🛰️
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-slate-800">데모 모드</p>
                <p className="text-xs text-slate-400">지도 탭으로 위치를 자유롭게 이동</p>
              </div>
            </div>
            <div className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
              demoMode ? 'bg-rose-500' : 'bg-slate-200'
            }`}>
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                demoMode ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </button>

          {demoMode && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs font-medium text-rose-500">
                GPS가 비활성화되었습니다. 지도를 탭하면 해당 위치로 즉시 이동합니다.
              </p>
            </div>
          )}
        </MotionDiv>

        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 0.16 }}
        >
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-[15px] font-semibold text-rose-500 transition-colors active:bg-slate-50"
          >
            로그아웃
          </button>
        </MotionDiv>
      </div>
    </div>
  )
}
