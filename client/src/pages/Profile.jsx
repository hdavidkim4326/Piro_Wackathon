/**
 * 프로필 페이지
 * ────────────
 * 사용자 정보 입력/수정과 소속 대학교 설정을 담당한다.
 * MVP 단계에서는 간단한 닉네임/대학교 입력 폼을 제공한다.
 */

import { useState } from 'react'
import useGameStore from '../store/gameStore'

/**
 * 프로필 설정 페이지 컴포넌트.
 * 닉네임과 대학교를 입력받아 Zustand 스토어에 저장한다.
 */
export default function Profile() {
  const user = useGameStore((state) => state.user)
  const setUser = useGameStore((state) => state.setUser)

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [university, setUniversity] = useState(user?.university || '')
  const [saved, setSaved] = useState(false)

  /**
   * 폼 제출 핸들러 — 사용자 정보를 저장한다.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nickname.trim() || !university.trim()) return

    setUser({ nickname: nickname.trim(), university: university.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* 헤더 */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-surface-light px-4 py-3">
        <h1 className="text-lg font-bold text-primary max-w-lg mx-auto">
          내 프로필
        </h1>
      </header>

      {/* 프로필 폼 */}
      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 프로필 아바타 */}
          <div className="flex justify-center pt-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
              {user?.nickname ? user.nickname.charAt(0).toUpperCase() : '?'}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="게임에서 사용할 닉네임"
              maxLength={30}
              className="w-full px-4 py-3 bg-surface-light border border-surface-light focus:border-primary rounded-xl text-text-primary placeholder-text-secondary/50 outline-none transition-colors"
            />
          </div>

          {/* 대학교 입력 */}
          <div>
            <label
              htmlFor="university"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              소속 대학교
            </label>
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="예: 서울대학교"
              maxLength={50}
              className="w-full px-4 py-3 bg-surface-light border border-surface-light focus:border-primary rounded-xl text-text-primary placeholder-text-secondary/50 outline-none transition-colors"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
          >
            {saved ? '저장 완료!' : '저장하기'}
          </button>
        </form>

        {/* 현재 저장된 정보 */}
        {user && (
          <div className="mt-6 p-4 bg-surface-light rounded-xl">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">
              현재 저장된 정보
            </h3>
            <p className="text-text-primary">
              <span className="text-text-secondary">닉네임:</span>{' '}
              {user.nickname}
            </p>
            <p className="text-text-primary">
              <span className="text-text-secondary">대학교:</span>{' '}
              {user.university}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
