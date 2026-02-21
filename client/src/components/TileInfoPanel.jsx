import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { useOccupyTile } from '../hooks/useTiles'
import TileGameModal from './TileGameModal'
import PeanutMax from '../pages/PeanutMax'

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MotionDiv = motion.div

const K = {
  emptyTile: '\uBE48 \uB545',
  territory: '\uC601\uD1A0',
  allyTerritory: '\uC544\uAD70 \uC601\uD1A0',
  enemyTerritory: '\uC801\uAD70 \uC601\uD1A0',
  neutral: '\uC911\uB9BD',
  currentPosition: '\uD604\uC7AC \uC704\uCE58',
  specialMission: '\uD2B9\uC218 \uBBF8\uC158',
  special: '\uD2B9\uC218',
  moveToTileHint:
    '\uC774 \uD0C0\uC77C \uC704\uB85C \uC774\uB3D9\uD574\uC57C \uBBF8\uC158\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uC5B4\uC694.',
  enableLocationHint: ' (\uC704\uCE58 \uAD8C\uD55C\uC744 \uBA3C\uC800 \uCF1C\uC8FC\uC138\uC694)',
  occupying: '\uC810\uB839 \uC911...',
  occupy: '\uC810\uB839\uD558\uAE30',
  reinforce: '\uAC15\uD654\uD558\uAE30',
  steal: '\uBE7C\uC557\uAE30',
  close: '\uB2EB\uAE30',
  tauntEmpty1: '\uC544\uC9C1 \uC544\uBB34\uB3C4 \uC810\uB839\uD558\uC9C0 \uC54A\uC740 \uB545\uC785\uB2C8\uB2E4.',
  tauntEmpty2: '\uC9C0\uAE08 \uC120\uC810\uD558\uBA74 \uC6B0\uB9AC \uD559\uAD50\uC758 \uAC70\uC810\uC774 \uB429\uB2C8\uB2E4.',
  tauntEmpty3: '\uBE48 \uD0C0\uC77C \uBC1C\uACAC! \uBA3C\uC800 \uC810\uB839\uD558\uC138\uC694.',
  tauntEmpty4: '\uAE30\uD68C\uC785\uB2C8\uB2E4. \uBE60\uB974\uAC8C \uC810\uB839\uD574 \uBCF4\uC138\uC694.',
  tauntEnemy1: '\uC0C1\uB300 \uD559\uAD50 \uC601\uD1A0\uC785\uB2C8\uB2E4. \uBE7C\uC557\uC544\uC57C \uD569\uB2C8\uB2E4.',
  tauntEnemy2: '\uC801 \uC601\uD1A0 \uD55C\uAC00\uC6B4\uB370\uC785\uB2C8\uB2E4. \uBC18\uACA9\uD574 \uBCF4\uC138\uC694.',
  tauntEnemy3: '\uC5EC\uAE30\uB9CC \uB4A4\uC9D1\uC5B4\uB3C4 \uD750\uB984\uC774 \uBC14\uB01D\uB2C8\uB2E4.',
  tauntEnemy4: '\uACF5\uACA9 \uC131\uACF5 \uC2DC \uC6B0\uB9AC \uC0C9\uC73C\uB85C \uBC14\uB01D\uB2C8\uB2E4.',
  tauntMine1: '\uC6B0\uB9AC \uC601\uD1A0\uC785\uB2C8\uB2E4. \uAC15\uD654\uD574\uC11C \uC9C0\uCF1C\uB0B4\uC138\uC694.',
  tauntMine2: '\uBC29\uC5B4\uB97C \uC704\uD574 \uB808\uBCA8\uC744 \uC62C\uB824\uB450\uB294 \uAC8C \uC88B\uC2B5\uB2C8\uB2E4.',
  tauntMine3: '\uD604\uC7AC \uC6B0\uB9AC \uD559\uAD50\uAC00 \uC810\uC720 \uC911\uC778 \uD0C0\uC77C\uC785\uB2C8\uB2E4.',
}

function calcGridId(lat, lng) {
  return `grid_${Math.floor(lat / LAT_STEP)}_${Math.floor(lng / LNG_STEP)}`
}

const UNIV_DOT_COLORS = {
  '\uC11C\uC6B8\uB300\uD559\uAD50': '#3b82f6',
  '\uC5F0\uC138\uB300\uD559\uAD50': '#0ea5e9',
  '\uACE0\uB824\uB300\uD559\uAD50': '#ef4444',
  '\uD55C\uC591\uB300\uD559\uAD50': '#a855f7',
}

const TAUNTS_EMPTY = [K.tauntEmpty1, K.tauntEmpty2, K.tauntEmpty3, K.tauntEmpty4]
const TAUNTS_ENEMY = [K.tauntEnemy1, K.tauntEnemy2, K.tauntEnemy3, K.tauntEnemy4]
const TAUNTS_MINE = [K.tauntMine1, K.tauntMine2, K.tauntMine3]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function TileInfoPanel() {
  const selectedTile = useGameStore((s) => s.selectedTile)
  const setSelectedTile = useGameStore((s) => s.setSelectedTile)
  const user = useGameStore((s) => s.user)
  const location = useGameStore((s) => s.location)
  const navigate = useNavigate()

  const { mutate: occupy, isPending } = useOccupyTile()

  const [gameOpen, setGameOpen] = useState(false)
  const [specialOpen, setSpecialOpen] = useState(false)
  const [specialTile, setSpecialTile] = useState(null)
  const [taunt] = useState(() => Math.random())

  const isOwned = Boolean(selectedTile?.owner_univ)
  const isMyTile = isOwned && user?.university && selectedTile?.owner_univ === user.university
  const isEnemyTile = isOwned && !isMyTile

  const myGridId = useMemo(() => {
    if (!location) return null
    return calcGridId(location.lat, location.lng)
  }, [location])

  const isAtTile = Boolean(myGridId && selectedTile && myGridId === selectedTile.grid_id)

  const tileColor = selectedTile?.owner_univ
    ? UNIV_DOT_COLORS[selectedTile.owner_univ.trim()] || '#f97316'
    : null

  const tauntText = useMemo(() => {
    if (!selectedTile) return ''
    if (!isOwned) return pickRandom(TAUNTS_EMPTY)
    if (isMyTile) return pickRandom(TAUNTS_MINE)
    return pickRandom(TAUNTS_ENEMY)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTile?.grid_id, taunt])

  useEffect(() => {
    if (!selectedTile?.is_special) return

    if (!user) {
      setSelectedTile(null)
      navigate('/auth')
      return
    }

    setSpecialTile(selectedTile)
    setSpecialOpen(true)
    setGameOpen(false)
    setSelectedTile(null)
  }, [navigate, selectedTile, setSelectedTile, user])

  const handleStartMission = () => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (selectedTile?.in_special_zone || selectedTile?.is_special) {
      const centerGridId = selectedTile?.special_center_grid_id || selectedTile?.grid_id
      setSpecialTile({
        ...selectedTile,
        grid_id: centerGridId,
        special_center_grid_id: centerGridId,
        is_special: true,
        special_type: selectedTile?.special_type || selectedTile?.special_zone_type || '3x3',
      })
      setSpecialOpen(true)
      return
    }

    setGameOpen(true)
  }

  const handleMissionSuccess = (gridId, result = null) => {
    if (!gridId || !user) return

    setGameOpen(false)
    setSelectedTile(null)

    occupy(
      {
        gridId,
        university: user.university,
        level: Math.max(1, Number(result?.gameLevel || 1)),
        userId: user.id,
      },
      {
        onSuccess: () => {
          console.log('[TileInfoPanel] occupy API completed:', { gridId })
        },
        onError: (error) => {
          console.error('[TileInfoPanel] occupy API failed:', {
            gridId,
            error: error?.message,
          })
        },
      }
    )
  }

  const handleClose = () => {
    setGameOpen(false)
    setSpecialOpen(false)
    setSpecialTile(null)
    setSelectedTile(null)
  }

  const actionLabel = () => {
    if (isPending) return K.occupying
    if (selectedTile?.in_special_zone || selectedTile?.is_special) return K.specialMission
    if (!isOwned) return K.occupy
    if (isMyTile) return K.reinforce
    return K.steal
  }

  return (
    <AnimatePresence>
      {selectedTile && (
        <MotionDiv
          key="tile-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-[55] rounded-t-3xl border-t border-slate-200/80 bg-white pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl"
          style={{ maxHeight: '70dvh' }}
        >
          <div className="overflow-y-auto px-5 pt-3 pb-2">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {tileColor && (
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: tileColor }}
                    />
                  )}
                  <h3 className="truncate text-[17px] font-extrabold leading-tight text-slate-800">
                    {isOwned ? `${selectedTile.owner_univ} ${K.territory}` : K.emptyTile}
                  </h3>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">{selectedTile.grid_id}</p>
              </div>

              <span
                className={`shrink-0 rounded-xl px-2.5 py-1 text-[13px] font-bold ${
                  isOwned ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                Lv.{selectedTile.level || 0}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                  isOwned
                    ? isMyTile
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-500'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isOwned ? (isMyTile ? K.allyTerritory : K.enemyTerritory) : K.neutral}
              </span>

              {isAtTile && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                  {K.currentPosition}
                </span>
              )}

              {selectedTile.is_special && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                  {K.special} {selectedTile.special_type || '3x3'}
                </span>
              )}
            </div>

            <div
              className={`mb-4 rounded-2xl px-4 py-3 text-[13px] font-semibold leading-relaxed ${
                isEnemyTile
                  ? 'bg-rose-50 text-rose-600'
                  : isMyTile
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {tauntText}
            </div>

            {!isAtTile && (
              <div className="mb-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px] font-medium text-slate-500">
                {K.moveToTileHint}
                {!location && K.enableLocationHint}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={handleStartMission}
                disabled={isPending || !isAtTile}
                className={`flex-1 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none ${
                  isEnemyTile ? 'bg-rose-500 shadow-rose-500/20' : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {actionLabel()}
              </button>
              <button
                onClick={handleClose}
                className="shrink-0 rounded-2xl bg-slate-100 px-5 py-3.5 text-[15px] font-bold text-slate-500 transition-all active:scale-[0.97] active:bg-slate-200"
              >
                {K.close}
              </button>
            </div>
          </div>
        </MotionDiv>
      )}

      {gameOpen && selectedTile && (
        <TileGameModal
          key={selectedTile.grid_id}
          tile={selectedTile}
          onClose={() => setGameOpen(false)}
          onMissionSuccess={handleMissionSuccess}
        />
      )}

      <PeanutMax
        open={specialOpen}
        tile={specialTile}
        onClose={() => {
          setSpecialOpen(false)
          setSpecialTile(null)
        }}
        onCaptureSuccess={(payload) => {
          console.log('[TileInfoPanel] special mission success:', payload)
          setSpecialOpen(false)
          setSpecialTile(null)
        }}
      />
    </AnimatePresence>
  )
}
