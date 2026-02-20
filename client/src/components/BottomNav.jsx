/**
 * 하단 네비게이션 바 컴포넌트
 * ──────────────────────────
 * 모바일 앱처럼 화면 하단에 고정되는 탭 네비게이션.
 * 각 탭은 react-router-dom의 NavLink로 페이지를 전환한다.
 */

import { NavLink } from 'react-router-dom'

// ─── 네비게이션 탭 목록 ─────────────────────────────────────
const NAV_ITEMS = [
  { to: '/', label: '지도', icon: '🗺️' },
  { to: '/ranking', label: '랭킹', icon: '🏆' },
  { to: '/profile', label: '프로필', icon: '👤' },
]

/**
 * 하단 고정 네비게이션 바.
 * 현재 활성 탭은 하이라이트 스타일이 적용된다.
 */
export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-surface-light">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
