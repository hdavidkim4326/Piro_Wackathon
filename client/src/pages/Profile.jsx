/**
 * 프로필 페이지 — 토스 스타일 라이트 테마
 * ──────────────────────────────────────
 * 닉네임과 소속 대학교를 입력받아 Zustand 스토어에 저장한다.
 * 글래스모피즘 카드 + 그라데이션 버튼 디자인.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'

/**
 * 프로필 설정 페이지 컴포넌트.
 */
export default function Profile() {
  const user = useGameStore((s) => s.user)
  const setUser = useGameStore((s) => s.setUser)

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [university, setUniversity] = useState(user?.university || '')
  const [saved, setSaved] = useState(false)

  /** 폼 제출 → Zustand에 사용자 정보 저장 */
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nickname.trim() || !university.trim()) return

    setUser({ nickname: nickname.trim(), university: university.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight max-w-lg mx-auto">
          내 프로필
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 아바타 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            className="flex justify-center pt-2"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center text-4xl font-black text-white">
              {user?.nickname ? user.nickname.charAt(0).toUpperCase() : '?'}
            </div>
          </motion.div>

          {/* 닉네임 입력 */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-semibold text-slate-500 mb-2">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 사용할 닉네임"
              maxLength={30}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-slate-800 placeholder-slate-300 outline-none transition-all font-medium"
            />
          </div>

          {/* 대학교 입력 */}
          <div>
            <label htmlFor="university" className="block text-sm font-semibold text-slate-500 mb-2">
              소속 대학교
            </label>
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="예: 서울대학교"
              maxLength={50}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-slate-800 placeholder-slate-300 outline-none transition-all font-medium"
            />
          </div>

          {/* 저장 버튼 */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span>✅</span> 저장 완료!
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                >
                  저장하기
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        {/* 현재 저장된 정보 카드 */}
        <AnimatePresence>
          {user && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, delay: 0.1 }}
              className="mt-6 bg-white rounded-2xl p-5 shadow-sm shadow-slate-900/[0.04] border border-slate-100"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                저장된 정보
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">닉네임</span>
                  <span className="text-sm font-bold text-slate-700">{user.nickname}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">대학교</span>
                  <span className="text-sm font-bold text-slate-700">{user.university}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
