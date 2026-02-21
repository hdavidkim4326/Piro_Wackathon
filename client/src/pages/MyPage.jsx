import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore, { useGame } from '../store/gameStore'
import { fetchMyTileCount, logoutUser } from '../lib/api'
import { getUnivAsset, getUnivColor, getUnivInitials } from '../lib/univAssets'

const K = {
  deleteTitle: '정말 탈퇴할까요?',
  deleteBody:
    '점령 기록과 정보가 삭제될 수 있습니다.',
  cancel: '취소',
  deleting: '처리 중...',
  deleteAccount: '탈퇴하기',
  totalTiles: '내 점령 수',
  tiles: '칸',
  rankPrefix: '전체',
  rankSuffix: '위',
  profileEdit: '프로필 수정',
  profileEditSub: '닉네임, 학교, 비밀번호 수정',
  demoMode: '데모 모드',
  demoModeSub: '지도 탭으로 위치 이동',
  logout: '로그아웃',
  deleteLabel: '회원탈퇴',
  emailFallback: '미등록 이메일',
}

function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="fixed left-5 right-5 top-1/2 z-[91] -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
      >
        <p className="text-center text-[2rem]">⚠️</p>
        <h3 className="mt-3 text-center text-[1.1rem] font-black text-slate-800">{K.deleteTitle}</h3>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-400">{K.deleteBody}</p>
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl bg-slate-100 text-[14px] font-bold text-slate-500"
          >
            {K.cancel}
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            disabled={loading}
            className="h-12 flex-1 rounded-2xl text-[14px] font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#E79380,#DF7E66)' }}
          >
            {loading ? K.deleting : K.deleteAccount}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

function UnivLogo({ asset, size = 72 }) {
  const [imgErr, setImgErr] = useState(false)
  const initials = getUnivInitials(asset.name)
  const showLogo = asset.logo && !imgErr

  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl"
      style={{
        width: size,
        height: size,
        background: showLogo ? 'rgba(255,255,255,0.20)' : asset.color,
        border: '2.5px solid rgba(255,255,255,0.35)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
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
            fontSize: size * 0.28,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

function TileCard({ count, rank, total }) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mx-5 rounded-[24px] p-5 border-2 border-[#ffe8cc] bg-[#fff9f0] shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#8d6e63]">{K.totalTiles}</span>
        <span className="tabular-nums text-3xl font-black text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>
          {count}
          <span className="ml-1 text-[16px] font-bold"> {K.tiles}</span>
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#fff4e6] border border-[#ffe8cc]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#ffd8a8] to-[#ff922b]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
        />
      </div>

      <p className="mt-2 text-[12px] font-semibold text-[#8d6e63]">
        {rank > 0 ? <span className="text-[#d9480f]">{K.rankPrefix} {rank}{K.rankSuffix} </span> : ''}
        {total > 0 ? `${total}${K.tiles} 중 ${count}${K.tiles}` : `${count}${K.tiles}`}
      </p>
    </motion.div>
  )
}

function MenuItem({ icon, label, sublabel, onClick, chevron = true }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, background: '#fff4e6' }}
      onClick={onClick}
      className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffd8a8] text-xl text-white shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#5d4037]">{label}</p>
        {sublabel && <p className="text-[12px] font-medium text-[#8d6e63]">{sublabel}</p>}
      </div>
      {chevron && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d9480f"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </motion.button>
  )
}

function DemoModeRow({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3.5 border-t-2 border-[#ffe8cc] px-5 py-4 text-left transition-colors hover:bg-[#fff9f0]"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffd8a8] text-xl shadow-sm">
          📍
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-[#5d4037]">데모 모드</p>
          <p className="text-[12px] font-medium text-[#8d6e63]">지도 탭으로 위치 이동 (시연용)</p>
        </div>
      </div>
      <div
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 border-2 ${enabled ? 'border-[#ff922b] bg-[#ff922b]' : 'border-[#ffe8cc] bg-white'
          }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-[#d9480f]'
            }`}
        />
      </div>
    </button>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useGame()
  const { user, occupiedTiles } = state

  const demoMode = useGameStore((s) => s.demoMode)
  const setDemoMode = useGameStore((s) => s.setDemoMode)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [serverTileCount, setServerTileCount] = useState(null)

  useEffect(() => {
    fetchMyTileCount()
      .then((res) => setServerTileCount(res?.count ?? null))
      .catch(() => setServerTileCount(null))
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
    }
  }, [navigate, user])

  const rankings = useMemo(() => calcRanking(occupiedTiles), [occupiedTiles])

  if (!user) return null

  const safeEmail = user?.email || ''
  const asset = getUnivAsset(safeEmail)

  // 내 팀 점령 타일 수 (서버 우선, 없으면 로컬)
  const localTileCount = Object.values(occupiedTiles || {}).filter(
    (t) => t?.university === user.university
  ).length
  const tileCount = serverTileCount ?? localTileCount
  const totalTiles = Object.keys(occupiedTiles || {}).length
  const myRank = rankings.findIndex((r) => r.university === user.university) + 1

  // 대학 브랜드 컬러 (univAssets)
  const brandColor = asset.color || getUnivColor(user.university)

  const handleLogout = () => {
    try {
      logoutUser()
    } catch (error) {
      console.error('[MyPage] logout failed:', error)
    }
    dispatch({ type: 'LOGOUT' })
    window.location.href = '/auth'
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      // TODO: deleteMyAccount API
    } catch (error) {
      console.error('[MyPage] delete failed:', error)
    } finally {
      try {
        logoutUser()
      } catch (error) {
        console.error('[MyPage] delete->logout failed:', error)
      }
      dispatch({ type: 'DELETE_ACCOUNT' })
      setDeleteLoading(false)
      window.location.href = '/auth'
    }
  }

  return (
    <div
      className="h-full overflow-y-auto bg-[#fff9f0]"
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >
      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden px-5 pb-10 pt-16 shadow-sm border-b-[3px] border-[#ffd8a8]" style={{ background: brandColor }}>
        {/* 장식 */}
        <div
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full opacity-20 blur-xl"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative z-10 flex items-center gap-5"
        >
          <div className="shadow-lg rounded-2xl p-1 bg-white/20 backdrop-blur-sm">
            <UnivLogo asset={asset} size={72} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[26px] font-black leading-tight text-white drop-shadow-md" style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "1px" }}>
              {user.nickname}
            </p>
            <p className="mt-1 truncate text-[14px] font-bold text-white/90 drop-shadow-sm">
              {user.university || asset.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-white/70">
              {safeEmail || K.emailFallback}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="mt-6">
        <TileCard count={tileCount} rank={myRank} total={totalTiles} />
      </div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="mx-5 mt-4 overflow-hidden rounded-[24px] bg-white shadow-md border-2 border-[#ffe8cc]"
      >
        <MenuItem
          icon="👤"
          label={K.profileEdit}
          sublabel={K.profileEditSub}
          onClick={() => navigate('/profile-edit')}
        />
        <DemoModeRow enabled={demoMode} onToggle={() => setDemoMode(!demoMode)} />
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.34 }}
        className="mx-5 mb-28 mt-4"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="h-14 w-full rounded-2xl text-[16px] font-black text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #ff922b, #d9480f)',
            fontFamily: "'MemomentKkukkukk', sans-serif",
            letterSpacing: "1px"
          }}
        >
          {K.logout}
        </motion.button>

        <button
          onClick={() => setShowDelete(true)}
          className="mt-3 w-full py-3 text-[13px] font-bold text-[#adb5bd] transition-colors hover:text-[#d9480f]"
        >
          {K.deleteLabel}
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
