import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGameStore, { useGame } from '../store/gameStore'
import { fetchMyTileCount, logoutUser } from '../lib/api'
import { getUnivAsset, getUnivColor, getUnivInitials } from '../lib/univAssets'

const K = {
  deleteTitle: '\uC815\uB9D0 \uD0C8\uD1F4\uD560\uAE4C\uC694?',
  deleteBody:
    '\uC810\uB839 \uAE30\uB85D\uACFC \uC815\uBCF4\uAC00 \uC0AD\uC81C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  cancel: '\uCDE8\uC18C',
  deleting: '\uCC98\uB9AC \uC911...',
  deleteAccount: '\uD0C8\uD1F4\uD558\uAE30',
  totalTiles: '\uB0B4 \uC810\uB839 \uC218',
  tiles: '\uCE78',
  rankPrefix: '\uC804\uCCB4',
  rankSuffix: '\uC704',
  profileEdit: '\uD504\uB85C\uD544 \uC218\uC815',
  profileEditSub: '\uB2C9\uB124\uC784, \uD559\uAD50, \uBE44\uBC00\uBC88\uD638 \uC218\uC815',
  demoMode: '\uB370\uBAA8 \uBAA8\uB4DC',
  demoModeSub: '\uC9C0\uB3C4 \uD0ED\uC73C\uB85C \uC704\uCE58 \uC774\uB3D9',
  logout: '\uB85C\uADF8\uC544\uC6C3',
  deleteLabel: '\uD68C\uC6D0\uD0C8\uD1F4',
  emailFallback: '\uBBF8\uB4F1\uB85D \uC774\uBA54\uC77C',
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
        <p className="text-center text-[2rem]">\u26A0\uFE0F</p>
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
      className="mx-5 rounded-3xl p-5"
      style={{
        background: 'linear-gradient(135deg,rgba(253,204,128,0.18) 0%,rgba(235,184,101,0.10) 100%)',
        border: '1.5px solid rgba(235,184,101,0.30)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-500">{K.totalTiles}</span>
        <span className="tabular-nums text-[1.6rem] font-black" style={{ color: '#B8710A' }}>
          {count}
          <span className="ml-1 text-[14px] font-bold">{K.tiles}</span>
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'rgba(218,172,93,0.20)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#FDCC80,#EBB865,#DF7E66)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
        />
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400">
        {rank > 0 ? `${K.rankPrefix} ${rank}${K.rankSuffix} ` : ''}
        {total > 0 ? `${total}${K.tiles} \uC911 ${count}${K.tiles}` : `${count}${K.tiles}`}
      </p>
    </motion.div>
  )
}

function MenuItem({ icon, label, sublabel, onClick, chevron = true }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, background: 'rgba(235,184,101,0.06)' }}
      onClick={onClick}
      className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors"
    >
      <span className="w-8 flex-shrink-0 text-center text-[22px]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-slate-700">{label}</p>
        {sublabel && <p className="text-[11px] font-medium text-slate-400">{sublabel}</p>}
      </div>
      {chevron && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#CBD5E1"
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
      className="flex w-full items-center justify-between gap-3.5 border-t border-slate-100 px-5 py-4 text-left transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="w-8 flex-shrink-0 text-center text-[22px]">\uD83D\uDCCD</span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-700">{K.demoMode}</p>
          <p className="text-[11px] font-medium text-slate-400">{K.demoModeSub}</p>
        </div>
      </div>
      <div
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-rose-500' : 'bg-slate-200'
        }`}
      >
        <div
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useGame()
  const { user, occupiedTiles = {} } = state
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

  const localTileCount = Object.values(occupiedTiles).filter(
    (tile) => tile?.university === user.university
  ).length
  const tileCount = serverTileCount ?? localTileCount
  const totalTiles = Object.keys(occupiedTiles).length
  const myRank = rankings.findIndex((rankRow) => rankRow.university === user.university) + 1
  const brandColor = asset.color || getUnivColor(user.university)

  const handleLogout = () => {
    try {
      logoutUser()
    } catch (error) {
      console.error('[MyPage] logout failed:', error)
    }
    dispatch({ type: 'LOGOUT' })
    navigate('/auth', { replace: true })
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
      navigate('/auth', { replace: true })
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white" style={{ background: '#FDF9F4' }}>
      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative overflow-hidden px-5 pb-8 pt-14" style={{ background: brandColor }}>
        <div
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative z-10 flex items-center gap-4"
        >
          <UnivLogo asset={asset} size={68} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.3rem] font-black leading-tight text-white">{user.nickname}</p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-white/75">
              {user.university || asset.name}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-white/55">
              {safeEmail || K.emailFallback}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="mt-4">
        <TileCard count={tileCount} rank={myRank} total={totalTiles} />
      </div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="mx-5 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm"
        style={{ border: '1.5px solid rgba(235,184,101,0.18)' }}
      >
        <MenuItem
          icon="\uD83D\uDC64"
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
        className="mx-5 mb-28 mt-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="h-14 w-full rounded-2xl text-[14px] font-bold text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg,#FDCC80 0%,#EBB865 50%,#DF7E66 100%)',
            boxShadow: '0 6px 20px rgba(235,184,101,0.30)',
            color: '#5C3100',
          }}
        >
          {K.logout}
        </motion.button>

        <button
          onClick={() => setShowDelete(true)}
          className="mt-2 w-full py-3 text-[12px] font-semibold text-slate-300 transition-colors hover:text-rose-400"
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
