/**
 * 이벤트(챌린지) 페이지
 * ─────────────────────
 * Apple App Store + Toss 스타일의 하이엔드 챌린지 허브.
 * Flexbox gap을 활용하여 절대 레이아웃이 깨지지 않도록 설계됨.
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
    gradient: 'from-[#FF7A00] to-[#FF004D]',
    shadow: 'shadow-[#FF7A00]/20',
    category: '지역',
  },
  {
    id: 2,
    emoji: '🏢',
    title: '직장인 대전',
    desc: '회사 주변 영토를 확보하라!',
    date: '2026년 5월',
    gradient: 'from-[#00C6FF] to-[#0072FF]',
    shadow: 'shadow-[#00C6FF]/20',
    category: '직장',
  },
  {
    id: 3,
    emoji: '🎸',
    title: '동아리 배틀',
    desc: '우리 동아리가 캠퍼스 최강!',
    date: '2026년 4월',
    gradient: 'from-[#D946EF] to-[#8B5CF6]',
    shadow: 'shadow-[#D946EF]/20',
    category: '동아리',
  },
  {
    id: 4,
    emoji: '🎪',
    title: '축제 특별전',
    desc: '대학 축제 기간 한정 영토 전쟁',
    date: '2026년 5월',
    gradient: 'from-[#F59E0B] to-[#EF4444]',
    shadow: 'shadow-[#F59E0B]/20',
    category: '이벤트',
  },
]

// ─── 스태거 애니메이션 ───────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 280 } },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Events() {
  const user = useGameStore((s) => s.user)
  const countdown = useCountdown(HERO.endDate)

  return (
    // 🔥 백그라운드는 Toss 특유의 아주 밝은 회색(#F2F4F6) 느낌의 slate-50 사용, 하단 네비 공간(pb-32) 완벽 확보
    <div className="h-full overflow-y-auto bg-slate-50 pb-32 flex flex-col">
      
      {/* ━━━ 헤더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl px-6 py-4 border-b border-black/[0.04]">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">챌린지 탐색</h1>
      </header>

      {/* 🔥 [핵심 레이아웃] 모든 섹션은 flex-col과 gap-8로 묶여 절대 서로 겹치거나 파고들지 않습니다. */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8 px-5 pt-6"
      >
        
        {/* ━━━ 섹션 1: 히어로 — 현재 진행 중 ━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp}>
          {/* 배너 내부도 flex-col과 gap-5로 정렬하여 버튼이 삐져나가는 현상 원천 차단 */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5C6BFA] to-[#8050E3] p-6 shadow-xl shadow-[#5C6BFA]/20 flex flex-col gap-5">
            {/* 배경 장식 */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/[0.06] blur-2xl" />

            {/* LIVE 뱃지 & 헤더 */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                LIVE
              </span>
              <span className="text-[12px] font-bold text-white/70">MVP 시즌 1</span>
            </div>

            {/* 타이틀 영역 */}
            <div className="relative z-10 flex flex-col gap-1">
              <h2 className="text-[24px] font-extrabold leading-tight text-white tracking-tight">
                {HERO.title}
              </h2>
              <p className="text-[14px] font-medium text-white/80">
                {HERO.subtitle}
              </p>
            </div>

            {/* 카운트다운 */}
            <div className="relative z-10 flex gap-2">
              {[
                { val: countdown.days, label: '일' },
                { val: countdown.hours, label: '시' },
                { val: countdown.minutes, label: '분' },
                { val: countdown.seconds, label: '초' },
              ].map((t) => (
                <div key={t.label} className="flex flex-1 flex-col items-center rounded-2xl bg-white/15 py-2.5 backdrop-blur-md border border-white/10">
                  <span className="text-xl font-black tabular-nums text-white leading-none mb-1">{String(t.val).padStart(2, '0')}</span>
                  <span className="text-[11px] font-bold text-white/60">{t.label}</span>
                </div>
              ))}
            </div>

            {/* 통계 & 참여 버튼 */}
            <div className="relative z-10 flex flex-col gap-4 mt-1">
              <div className="flex gap-3">
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 backdrop-blur-sm">
                  <span className="text-sm">👥</span>
                  <span className="text-[12px] font-bold text-white">{HERO.participants.toLocaleString()}명</span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 backdrop-blur-sm">
                  <span className="text-sm">🗺️</span>
                  <span className="text-[12px] font-bold text-white">{HERO.territories.toLocaleString()}칸</span>
                </div>
              </div>

              <button className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-bold text-[#5C6BFA] shadow-lg transition-transform active:scale-[0.97]">
                <span className="text-lg">🎯</span>
                <span className="text-[15px]">{user ? '지도에서 점령하기' : '지금 바로 참여하기'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ━━━ 섹션 2: 프라이빗 방 CTA ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp}>
          {/* 🔥 찌그러짐 방지: p-6 적용 및 flex-col로 상하 분리 */}
          <div className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col gap-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-violet-50 to-[#F2F4F6] blur-2xl" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-slate-900 text-2xl shadow-lg shadow-slate-900/10">
                🔒
              </div>
              <div className="flex-1">
                <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">프라이빗 챌린지</h3>
                <p className="mt-1 text-[13px] leading-snug text-slate-500">
                  초대 링크를 공유해 친구들만의<br/>비공개 전쟁을 시작하세요.
                </p>
              </div>
            </div>

            {/* 🔥 Grid 레이아웃 적용으로 화면이 좁아져도 절대 찌그러지지 않음 */}
            <div className="relative z-10 grid grid-cols-3 gap-2">
              {[
                { icon: '🏠', label: '방 만들기' },
                { icon: '🔗', label: '초대 링크' },
                { icon: '📊', label: '전용 랭킹' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3.5 border border-slate-100/50">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[11px] font-bold text-slate-600">{f.label}</span>
                </div>
              ))}
            </div>

            <button className="relative z-10 flex h-14 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-[14px] font-bold text-slate-400 transition-colors active:bg-slate-50 cursor-not-allowed">
              곧 오픈 예정
            </button>
          </div>
        </motion.div>

        {/* ━━━ 섹션 3: 커밍순 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">곧 열리는 챌린지</h2>
              <p className="mt-1 text-[13px] text-slate-500">다양한 소속으로 땅따먹기를 즐겨보세요</p>
            </div>
            <span className="text-[13px] font-bold text-[#5C6BFA]">{UPCOMING.length}개</span>
          </div>

          {/* 🔥 가로 스크롤 카드 영역: 화면 양끝까지 가득 차게 -mx-5 px-5 적용 */}
          <div className="-mx-5 px-5 flex gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden pb-4">
            {UPCOMING.map((item) => (
              <div
                key={item.id}
                // 🔥 w-[260px] shrink-0 설정으로 카드가 절대 줄어들거나 찌그러지지 않음
                className="w-[260px] shrink-0 snap-start rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br ${item.gradient} text-2xl shadow-lg ${item.shadow}`}>
                    {item.emoji}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                    {item.category}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <h4 className="text-[17px] font-bold text-slate-900 tracking-tight truncate">{item.title}</h4>
                  <p className="text-[13px] leading-relaxed text-slate-500 line-clamp-2 min-h-[40px]">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-[12px] font-bold text-slate-400">{item.date}</span>
                  <span className="rounded-full bg-[#5C6BFA]/10 px-3 py-1 text-[11px] font-bold text-[#5C6BFA]">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ━━━ 하단 비전 텍스트 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div variants={fadeUp} className="mb-2 rounded-[24px] bg-slate-200/50 p-6 text-center">
          <p className="text-[13px] leading-relaxed text-slate-500">
            <span className="font-bold text-slate-700">Campus Turf War</span>는 대학생뿐 아니라<br/>
            직장인, 동아리, 지역 등 다양한 소속 기반의<br/>
            땅따먹기 챌린지를 준비하고 있습니다. 🚀
          </p>
        </motion.div>

      </motion.div>
    </div>
  )
}