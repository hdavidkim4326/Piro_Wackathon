/**
 * 이벤트(챌린지) 페이지
 * ─────────────────────
 * Apple App Store + Toss 스타일의 챌린지 허브.
 * 현재 진행 중인 대학 대전, 프라이빗 방, 커밍순 챌린지를 보여준다.
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

// ─── 더미 데이터 ─────────────────────────────────────────────
const HERO = {
  title: '🏫 전국 대학교 대전',
  subtitle: '우리 학교 땅을 넓혀라!',
  desc: '30m 격자로 캠퍼스 주변을 점령하고 전국 대학 순위를 올리세요.',
  participants: 1247,
  territories: 8923,
  endDate: '2026-03-15T23:59:59',
  tags: ['대학생 전용', '실시간 점령', 'MVP 시즌'],
}

const UPCOMING = [
  {
    id: 1,
    emoji: '🏠',
    title: '고향 대전',
    desc: '내 고향 vs 네 고향, 지역 자존심 대결',
    date: '2026년 4월',
    gradient: 'from-orange-500 to-rose-500',
    shadow: 'shadow-orange-500/20',
    category: '지역',
  },
  {
    id: 2,
    emoji: '🏢',
    title: '직장인 대전',
    desc: '회사 주변 영토를 확보하라!',
    date: '2026년 5월',
    gradient: 'from-cyan-500 to-blue-500',
    shadow: 'shadow-cyan-500/20',
    category: '직장',
  },
  {
    id: 3,
    emoji: '🎸',
    title: '동아리 배틀',
    desc: '우리 동아리가 캠퍼스 최강!',
    date: '2026년 4월',
    gradient: 'from-fuchsia-500 to-pink-500',
    shadow: 'shadow-fuchsia-500/20',
    category: '동아리',
  },
  {
    id: 4,
    emoji: '🎪',
    title: '축제 특별전',
    desc: '대학 축제 기간 한정 영토 전쟁',
    date: '2026년 5월',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/20',
    category: '이벤트',
  },
  {
    id: 5,
    emoji: '🏫',
    title: '고등학교 동문전',
    desc: '모교를 위해 한 판 더!',
    date: '2026년 6월',
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
    category: '동문',
  },
]

// ─── 스태거 애니메이션 ───────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 260 } },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Events() {
  const user = useGameStore((s) => s.user)
  const countdown = useCountdown(HERO.endDate)

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
        <h1 className="text-lg font-extrabold text-slate-800">챌린지</h1>
      </header>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="px-4 pt-4"
      >
        {/* ━━━ 섹션 1: 히어로 — 현재 진행 중 ━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 shadow-xl shadow-indigo-500/20">
            {/* 배경 장식 */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/[0.07] blur-2xl" />

            {/* LIVE 뱃지 */}
            <div className="relative z-10 mb-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                LIVE
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                MVP 시즌 1
              </span>
            </div>

            {/* 타이틀 */}
            <h2 className="relative z-10 text-[22px] font-black leading-tight text-white">
              {HERO.title}
            </h2>
            <p className="relative z-10 mt-0.5 text-sm font-semibold text-white/70">
              {HERO.subtitle}
            </p>

            {/* 카운트다운 */}
            <div className="relative z-10 mt-4 flex gap-2">
              {[
                { val: countdown.days, label: '일' },
                { val: countdown.hours, label: '시' },
                { val: countdown.minutes, label: '분' },
                { val: countdown.seconds, label: '초' },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
                  <span className="text-lg font-black tabular-nums text-white">{String(t.val).padStart(2, '0')}</span>
                  <span className="text-[10px] font-semibold text-white/60">{t.label}</span>
                </div>
              ))}
              <div className="flex flex-1 items-center justify-end">
                <span className="text-[11px] font-medium text-white/50">남은 시간</span>
              </div>
            </div>

            {/* 통계 */}
            <div className="relative z-10 mt-4 flex gap-3">
              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <span className="text-sm">👥</span>
                <span className="text-xs font-bold text-white">{HERO.participants.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <span className="text-sm">🗺️</span>
                <span className="text-xs font-bold text-white">{HERO.territories.toLocaleString()}칸 점령</span>
              </div>
            </div>

            {/* 참여 버튼 */}
            <button className="relative z-10 mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-bold text-indigo-600 shadow-lg transition-all active:scale-[0.98]">
              <span className="text-base">🎯</span>
              <span className="text-sm">{user ? '지도에서 점령하기' : '참여하기'}</span>
            </button>
          </div>
        </motion.div>

        {/* ━━━ 섹션 2: 프라이빗 방 CTA ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp} className="mt-5">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 blur-xl" />

            <div className="relative z-10 flex items-start gap-4">
              {/* 아이콘 */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl shadow-lg shadow-violet-500/20">
                🔒
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-slate-800">프라이빗 챌린지</h3>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">
                  친구들만의 비공개 방을 만들고 초대 링크를 공유해 나만의 영토 전쟁을 시작하세요.
                </p>
              </div>
            </div>

            {/* 기능 미리보기 */}
            <div className="relative z-10 mt-4 flex gap-2">
              {[
                { icon: '🏠', label: '방 만들기' },
                { icon: '🔗', label: '초대 링크' },
                { icon: '📊', label: '전용 랭킹' },
              ].map((f) => (
                <div key={f.label} className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-[11px] font-bold text-slate-500">{f.label}</span>
                </div>
              ))}
            </div>

            <button className="relative z-10 mt-4 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 transition-all active:scale-[0.98] active:bg-slate-50">
              곧 오픈 예정
            </button>
          </div>
        </motion.div>

        {/* ━━━ 섹션 3: 커밍순 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp} className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">곧 열리는 챌린지</h2>
              <p className="mt-0.5 text-xs text-slate-400">다양한 소속으로 땅따먹기를 즐겨보세요</p>
            </div>
            <span className="text-xs font-semibold text-indigo-500">{UPCOMING.length}개</span>
          </div>
        </motion.div>

        {/* 가로 스크롤 카드 */}
        <motion.div variants={fadeUp} className="-mx-4 mb-6">
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
            {UPCOMING.map((item) => (
              <div
                key={item.id}
                className="w-[200px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all active:scale-[0.97]"
              >
                {/* 아이콘 + 카테고리 */}
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-xl shadow-lg ${item.shadow}`}>
                    {item.emoji}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                    {item.category}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-800">{item.title}</h4>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400 line-clamp-2">{item.desc}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">{item.date}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-500">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ━━━ 하단 비전 텍스트 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp} className="mb-6 rounded-2xl bg-slate-100/80 p-5 text-center">
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-bold text-slate-500">Campus Turf War</span>는 대학생뿐 아니라
            직장인, 동아리, 지역 등 다양한 소속 기반의 땅따먹기 챌린지를 준비하고 있습니다.
            더 많은 전쟁이 곧 찾아옵니다! 🚀
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
