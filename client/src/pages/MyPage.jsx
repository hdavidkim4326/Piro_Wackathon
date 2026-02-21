/**
 * pages/MyPage.jsx
 * ────────────────
 * 마이페이지
 *
 * 레이아웃 (세 번째 사진 참고):
 *   ① 상단 헤더 — 대학 브랜드 컬러 배경 + 로고 + 닉네임 + 소속
 *   ② 점령 땅 카드 — 내 팀이 차지한 타일 수 + 진행 바
 *   ③ 메뉴 리스트 — 프로필 수정 →
 *   ④ 하단 액션 — 로그아웃 / 회원탈퇴
 *
 * 컬러: #FDCC80 / #EBB865 / #DAAC5D / #E79380 / #DF7E66
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { getUnivAsset, getUnivColor, getUnivInitials } from '../lib/univAssets'
import { logoutUser, fetchMyTileCount } from '../lib/api'

// ─── 삭제 확인 모달 ───────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.88,    opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="fixed left-5 right-5 top-1/2 z-[91] -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <p className="text-center text-[2rem]">⚠️</p>
        <h3 className="mt-3 text-center text-[1.1rem] font-black text-slate-800">
          정말 탈퇴할까요?
        </h3>
        <p className="mt-2 text-center text-[13px] text-slate-400 leading-relaxed">
          점령한 모든 땅과 데이터가 삭제돼요.<br />이 작업은 되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl bg-slate-100 text-[14px] font-bold text-slate-500"
          >취소</button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#E79380,#DF7E66)' }}
          >
            {loading ? '처리 중...' : '탈퇴하기'}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

// ─── 대학 로고 아바타 ─────────────────────────────────────────
function UnivLogo({ asset, size = 72 }) {
  const [imgErr, setImgErr] = useState(false)
  const initials = getUnivInitials(asset.name)
  const showLogo = asset.logo && !imgErr

  return (
    <div
      className="rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{
        width:      size,
        height:     size,
        background: showLogo
          ? 'rgba(255,255,255,0.20)'
          : asset.color,
        border:     '2.5px solid rgba(255,255,255,0.35)',
        boxShadow:  '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      {showLogo ? (
        <img
          src={asset.logo}
          alt={asset.name}
          onError={() => setImgErr(true)}
          style={{ width: size * 0.72, height: size * 0.72, objectFit: 'contain' }}
        />
      ) : (
        <span
          className="font-black"
          style={{
            fontSize:    size * 0.28,
            color:       '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

// ─── 점령 땅 통계 카드 ────────────────────────────────────────
function TileCard({ count, rank, total }) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-5 rounded-3xl p-5"
      style={{
        background: 'linear-gradient(135deg,rgba(253,204,128,0.18) 0%,rgba(235,184,101,0.10) 100%)',
        border:     '1.5px solid rgba(235,184,101,0.30)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-slate-500">내 팀 점령 땅</span>
        <span
          className="text-[1.6rem] font-black tabular-nums"
          style={{ color: '#B8710A' }}
        >
          {count}<span className="text-[14px] font-bold ml-1">칸</span>
        </span>
      </div>

      {/* 진행 바 */}
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(218,172,93,0.20)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#FDCC80,#EBB865,#DF7E66)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
        />
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400">
        {rank > 0 ? `전체 ${rank}위 · ` : ''}전체 점령 타일 {total}칸 중 {count}칸
      </p>
    </motion.div>
  )
}

// ─── 메뉴 아이템 ─────────────────────────────────────────────
function MenuItem({ icon, label, sublabel, onClick, chevron = true }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, background: 'rgba(235,184,101,0.06)' }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-5 py-4 text-left transition-colors"
    >
      <span className="text-[22px] w-8 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-700">{label}</p>
        {sublabel && <p className="text-[11px] text-slate-400 font-medium">{sublabel}</p>}
      </div>
      {chevron && (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </motion.button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MyPage (메인 컴포넌트)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function MyPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useGame()
  const { user, occupiedTiles } = state

  const [showDelete,     setShowDelete]     = useState(false)
  const [deleteLoading,  setDeleteLoading]  = useState(false)
  const [serverTileCount, setServerTileCount] = useState(null)

  // 백엔드에서 타일 수 가져오기 (실패하면 로컬 계산으로 폴백)
  useEffect(() => {
    fetchMyTileCount()
      .then((res) => setServerTileCount(res?.count ?? null))
      .catch(() => setServerTileCount(null))
  }, [])

  if (!user) return null

  const safeEmail = user?.email || ''
  const asset    = getUnivAsset(safeEmail)
  const rankings = calcRanking(occupiedTiles)

  // 내 팀 점령 타일 수 (서버 우선, 없으면 로컬)
  const localTileCount = Object.values(occupiedTiles).filter(
    (t) => t.university === user.university
  ).length
  const tileCount  = serverTileCount ?? localTileCount
  const totalTiles = Object.keys(occupiedTiles).length
  const myRank     = rankings.findIndex((r) => r.university === user.university) + 1

  // 대학 브랜드 컬러 (univAssets )
  const brandColor = asset.color || getUnivColor(user.university)

  // ── 핸들러 ───────────────────────────────────────────────
  const handleLogout = () => {
    logoutUser()
    dispatch({ type: 'LOGOUT' })
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      // TODO: deleteMyAccount API 구현 예정
    } catch {
      // 서버 실패해도 로컬 상태는 초기화
    } finally {
      logoutUser()
      dispatch({ type: 'DELETE_ACCOUNT' })
      setDeleteLoading(false)
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-white" style={{ background: '#FDF9F4' }}>

      {/* ━━━ 삭제 모달 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      {/* ━━━ ① 상단 헤더 (대학 브랜드 컬러 배경) ━━━━━━━━━━━━ */}
      <div
        className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: brandColor }}
      >
        {/* 배경 장식 원 */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative z-10 flex items-center gap-4"
        >
          {/* 대학 로고 */}
          <UnivLogo asset={asset} size={68} />

          {/* 유저 정보 */}
          <div className="flex-1 min-w-0">
            <p className="text-[1.3rem] font-black text-white leading-tight truncate">
              {user.nickname}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-white/75 truncate">
              {user.university || asset.name}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/55 truncate">
              {safeEmail || '미등록 이메일'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ━━━ ② 점령 땅 카드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="mt-4">
        <TileCard count={tileCount} rank={myRank} total={totalTiles} />
      </div>

      {/* ━━━ ③ 메뉴 리스트 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="mx-5 mt-4 rounded-3xl bg-white overflow-hidden shadow-sm"
        style={{ border: '1.5px solid rgba(235,184,101,0.18)' }}
      >
        <MenuItem
          icon="✏️"
          label="프로필 수정"
          sublabel="닉네임·비밀번호 변경"
          onClick={() => navigate('/profile-edit')}
        />
      </motion.div>

      {/* ━━━ ④ 하단 액션 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.34 }}
        className="mx-5 mt-3 mb-28"
      >
        {/* 로그아웃 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl text-[14px] font-bold text-white shadow-md"
          style={{
            background:  'linear-gradient(135deg,#FDCC80 0%,#EBB865 50%,#DF7E66 100%)',
            boxShadow:   '0 6px 20px rgba(235,184,101,0.30)',
            color:       '#5C3100',
          }}
        >
          로그아웃
        </motion.button>

        {/* 회원탈퇴 */}
        <button
          onClick={() => setShowDelete(true)}
          className="w-full mt-2 py-3 text-[12px] font-semibold text-slate-300 transition-colors hover:text-rose-400"
        >
          회원탈퇴
        </button>
      </motion.div>
    </div>
  )
}

function calcRanking(occupiedTiles = {}) {
  const counts = {}

  Object.values(occupiedTiles || {}).forEach((tile) => {
    const university = tile?.university
    if (!university) return
    counts[university] = (counts[university] || 0) + 1
  })

  return Object.entries(counts)
    .map(([university, count]) => ({ university, count }))
    .sort((a, b) => b.count - a.count)
}
