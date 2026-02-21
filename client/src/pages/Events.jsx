/**
 * 이벤트(챌린지) 페이지
 * ─────────────────────
 * 다양한 시즌제 팀전 모드를 선택할 수 있는 화면.
 * 랭킹 페이지와 통일된 따뜻한 땅콩/황금 테마 적용.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'

// ─── 카운트다운 훅 ───────────────────────────────────────────
function useCountdown(targetDate) {
  const [left, setLeft] = useState(() => calc(targetDate))
  useEffect(() => {
    const id = setInterval(() => setLeft(calc(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return left
}

function calc(target) {
  const diff = Math.max(0, new Date(target) - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

// ─── 더미 데이터 (시즌제 모드들) ──────────────────────────────
const SEASONS = [
  {
    id: 1,
    emoji: '🏫',
    title: '전국 대학교 팀전',
    subtitle: '우리 학교의 명예를 걸고!',
    desc: '30m 격자로 학교 주변을 점령하고 땅콩을 모으세요.',
    participants: 1247,
    endDate: '2026-03-15T23:59:59',
    tags: ['현재 진행중', '대학생 전용'],
    isActive: true,
  },
  {
    id: 2,
    emoji: '🏠',
    title: '전국 지역별 대전',
    subtitle: '내 고향의 위상을 높여라!',
    desc: '서울 vs 경기 vs 경상 vs 전라 vs 충청 vs 강원 vs 제주',
    participants: 0,
    endDate: '2026-04-30T23:59:59',
    tags: ['다음 시즌', '지역 연합'],
    isActive: false,
  },
  {
    id: 3,
    emoji: '🎸',
    title: '동아리 배틀',
    subtitle: '캠퍼스 내 최강 동아리는?',
    desc: '같은 학교 내 동아리끼리 영토 쟁탈전을 벌입니다.',
    participants: 0,
    endDate: '2026-05-31T23:59:59',
    tags: ['오픈 예정', '소규모 팀전'],
    isActive: false,
  },
  {
    id: 4,
    emoji: '💼',
    title: '직장인 소속전',
    subtitle: '회사 주변은 우리가 접수한다!',
    desc: '판교, 강남, 여의도 직장인들의 회사를 건 한판 승부.',
    participants: 0,
    endDate: '2026-06-30T23:59:59',
    tags: ['오픈 예정', '직장인 전용'],
    isActive: false,
  }
]

// ─── 스태거 애니메이션 ───────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 280 } },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Events() {
  const user = useGameStore((s) => s.user)
  // MVP 구현이라 1번(대학교 대전) 카운트다운만 활성화
  const countdown = useCountdown(SEASONS[0].endDate)

  return (
    <div
      className="h-full overflow-y-auto bg-[#fff9f0] pb-32 flex flex-col items-center"
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >

      {/* ━━━ 헤더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 w-full z-20 border-b-[3px] border-[#ffd8a8] bg-[#fff9f0]/90 px-5 py-5 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-2">
          <span className="text-3xl drop-shadow-md">🏆</span>
          <h1
            className="text-center text-3xl font-black tracking-widest text-[#d9480f]"
            style={{
              fontFamily: "'MemomentKkukkukk', sans-serif",
              textShadow: "2px 2px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff"
            }}
          >
            시즌 모드
          </h1>
          <span className="text-3xl drop-shadow-md">🏆</span>
        </div>
      </header>

      {/* ━━━ 컨텐츠 영역 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-[90%] max-w-[420px] flex-col gap-6 pt-6"
      >

        {/* 안내 문구 */}
        <motion.div variants={fadeUp} className="text-center px-4">
          <p className="text-[15px] font-bold text-[#8d6e63] leading-relaxed break-keep">
            원하는 테마의 전쟁에 참여하세요!<br />
            (매월 새로운 시즌이 오픈됩니다 ✨)
          </p>
        </motion.div>

        {/* 시즌 카드 리스트 */}
        {SEASONS.map((season, index) => {
          const isActive = season.isActive;

          return (
            <motion.div
              key={season.id}
              variants={fadeUp}
              className={`relative overflow-hidden rounded-[24px] border-2 ${isActive ? 'border-[#ff922b]' : 'border-[#ffe8cc]'} bg-white p-5 shadow-md flex flex-col gap-4 transition-transform ${isActive ? 'active:scale-[0.98]' : ''}`}
            >
              {/* 뒷배경 이모지 장식 */}
              <div className="pointer-events-none absolute -right-6 -bottom-6 text-[80px] opacity-10 filter grayscale">
                {season.emoji}
              </div>

              {/* 뱃지 & 기한 */}
              <div className="relative z-10 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex flex-wrap gap-1.5 shrink">
                  {season.tags.map(tag => (
                    <span
                      key={tag}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 ${isActive && tag.includes('진행') ? 'bg-[#ff922b] text-white shadow-sm' : 'bg-[#fff4e6] text-[#d9480f]'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {isActive ? (
                  <span className="shrink-0 text-[12px] font-bold text-[#e67700] animate-pulse">
                    🔥 시즌 진행중
                  </span>
                ) : (
                  <span className="shrink-0 text-[12px] font-bold text-[#adb5bd]">
                    오픈 대기중
                  </span>
                )}
              </div>

              {/* 제목 & 아이콘 */}
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ${isActive ? 'bg-gradient-to-br from-[#ffd8a8] to-[#ff922b]' : 'bg-slate-100 filter grayscale opacity-60'}`}>
                  {season.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className={`text-[22px] font-black truncate ${isActive ? 'text-[#5d4037]' : 'text-slate-400'}`}
                    style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}
                  >
                    {season.title}
                  </h2>
                  <p className={`text-[13px] font-bold truncate ${isActive ? 'text-[#8d6e63]' : 'text-slate-400'}`}>
                    {season.subtitle}
                  </p>
                </div>
              </div>

              {/* 카드 본문 (D-Day 포함) */}
              <div className={`relative z-10 rounded-xl p-3 ${isActive ? 'bg-[#fff9f0]' : 'bg-slate-50'}`}>
                <p className={`text-[13px] leading-relaxed mb-3 break-keep ${isActive ? 'text-[#5d4037]' : 'text-slate-500'}`}>
                  {season.desc}
                </p>

                {isActive ? (
                  <div className="flex gap-1.5 justify-center">
                    {[
                      { val: countdown.days, label: '일' },
                      { val: countdown.hours, label: '시간' },
                      { val: countdown.minutes, label: '분' },
                      { val: countdown.seconds, label: '초' },
                    ].map((t, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center rounded-lg bg-white py-1.5 border border-[#ffe8cc] shadow-sm">
                        <span className="text-lg font-black tabular-nums text-[#d9480f] leading-none" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>
                          {String(t.val).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold text-[#8d6e63] mt-0.5">{t.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100 py-3 border border-slate-200">
                    <span className="text-xl font-bold text-slate-400" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>
                      시즌 종료까지 D-??
                    </span>
                  </div>
                )}
              </div>

              {/* 하단 버튼 영역 */}
              {isActive && (
                <button className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8d6e63] font-bold text-white shadow-md transition-colors active:bg-[#5d4037]">
                  <span className="text-lg" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>
                    {user ? '참여하기' : '로그인하고 참여하기'}
                  </span>
                </button>
              )}
            </motion.div>
          )
        })}

        <div className="h-10 w-full shrink-0"></div>
      </motion.div>
    </div>
  )
}