/**
 * 플로팅 알약 네비게이션 바 (젠리 스타일)
 * ──────────────────────────────────────
 * 화면 하단 중앙에 붕 떠 있는 알약(Pill) 모양 네비게이션.
 * 활성 탭은 스케일·색상 트랜지션으로 시각적 피드백을 준다.
 * 다크 글래스 배경 + 화이트 아이콘 조합으로 지도 위에서 잘 보인다.
 */

import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const MotionNav = motion.nav
const MotionDiv = motion.div

// ─── 네비게이션 탭 정의 ─────────────────────────────────────
const NAV_ITEMS = [
  { to: '/', label: '이벤트', icon: EventIcon },
  { to: '/', label: '지도', icon: MapIcon },
  { to: '/ranking', label: '랭킹', icon: TrophyIcon },
  { to: '/profile', label: '프로필', icon: PersonIcon },
]

/**
 * 젠리 스타일 플로팅 알약 네비게이션 바.
 */
export default function BottomNav() {
  const location = useLocation()

  return (
    <MotionNav
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280, delay: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-fit min-w-[260px] bg-slate-900/88 backdrop-blur-xl border border-white/[0.08] rounded-full px-5 py-3 shadow-2xl shadow-slate-900/30 flex justify-around items-center gap-6"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.to
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="relative flex flex-col items-center gap-0.5 outline-none"
          >
            {/* 활성 탭 배경 글로우 */}
            {isActive && (
              <MotionDiv
                layoutId="nav-active-bg"
                className="absolute -inset-2 bg-white/[0.08] rounded-2xl"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}

            <MotionDiv
              animate={{ scale: isActive ? 1.15 : 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="relative z-10"
            >
              <Icon active={isActive} />
            </MotionDiv>

            <span
              className={`relative z-10 text-[10px] font-semibold transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        )
      })}
    </MotionNav>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SVG 아이콘 컴포넌트 (인라인, 외부 의존성 없음)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 지도 아이콘 */
function MapIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="w-[22px] h-[22px]"
    >
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  )
}

/** 트로피 아이콘 */
function TrophyIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="w-[22px] h-[22px]"
    >
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" />
      <path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  )
}

/** 사람 아이콘 */
function PersonIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="w-[22px] h-[22px]"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 00-16 0" />
    </svg>
  )
}

/** 이벤트(캘린더) 아이콘 */
function EventIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#fff" : "#94a3b8"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[22px] h-[22px]"
    >
      {/* calendar frame */}
      <rect x="3" y="4" width="18" height="18" rx="2" />
      {/* top header line */}
      <path d="M3 10h18" />
      {/* rings */}
      <path d="M8 2v4M16 2v4" />
      {/* event dot */}
      <circle cx="12" cy="15" r="1.5" />
    </svg>
  )
}
