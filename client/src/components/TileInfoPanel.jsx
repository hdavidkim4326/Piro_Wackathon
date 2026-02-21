/**
 * 타일 정보 바텀 시트
 * ─────────────────────
 * 지도에서 타일을 탭하면 올라오는 패널.
 * 현재 위치 타일에서만 점령/강화/빼앗기 가능.
 *
 * [CSS 리디자인] 로직·클래스명 동일, 컬러만 amber-coral 팔레트로 교체
 * #FDCC80 / #EBB865 / #DAAC5D / #E79380 / #DF7E66
 */

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
  emptyTile: '빈 땅',
  territory: '영토',
  allyTerritory: '아군 영토',
  enemyTerritory: '적군 영토',
  neutral: '미점령',
  currentPosition: '현재 위치',
  specialMission: '특수 미션',
  special: '특수',
  moveToTileHint:
    '이 타일 위로 이동해야 미션을 시작할 수 있어요.',
  enableLocationHint: ' (위치 권한을 먼저 켜주세요)',
  occupying: '점령 중...',
  occupy: '점령하기',
  reinforce: '강화하기',
  steal: '땅 빼앗기!',
  close: '닫기',
  tauntEmpty1: '아직 아무도 점령하지 않은 땅입니다.',
  tauntEmpty2: '지금 선점하면 우리 학교의 거점이 됩니다.',
  tauntEmpty3: '빈 타일 발견! 먼저 점령하세요.',
  tauntEmpty4: '기회입니다. 빠르게 점령해 보세요.',
  tauntEnemy1: '상대 학교 영토입니다. 빼앗아야 합니다.',
  tauntEnemy2: '적 영토 한가운데입니다. 반격해 보세요.',
  tauntEnemy3: '여기만 뒤집어도 흐름이 바뀝니다.',
  tauntEnemy4: '공격 성공 시 우리 색으로 바뀝니다.',
  tauntMine1: '우리 영토입니다. 강화해서 지켜내세요.',
  tauntMine2: '방어를 위해 레벨을 올려두는 게 좋습니다.',
  tauntMine3: '현재 우리 학교가 점유 중인 타일입니다.',
}

function calcGridId(lat, lng) {
  return `grid_${Math.floor(lat / LAT_STEP)}_${Math.floor(lng / LNG_STEP)}`
}

const UNIV_DOT_COLORS = {
  '서울대학교': '#3b82f6',
  '연세대학교': '#0ea5e9',
  '고려대학교': '#ef4444',
  '한양대학교': '#a855f7',
}

const TAUNTS_EMPTY = [K.tauntEmpty1, K.tauntEmpty2, K.tauntEmpty3, K.tauntEmpty4]
const TAUNTS_ENEMY = [K.tauntEnemy1, K.tauntEnemy2, K.tauntEnemy3, K.tauntEnemy4]
const TAUNTS_MINE = [K.tauntMine1, K.tauntMine2, K.tauntMine3]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function TileInfoPanel() {
  const selectedTile    = useGameStore((s) => s.selectedTile)
  const setSelectedTile = useGameStore((s) => s.setSelectedTile)
  const user            = useGameStore((s) => s.user)
  const location        = useGameStore((s) => s.location)
  const navigate        = useNavigate()
  const { mutate: occupy, isPending } = useOccupyTile()

  const [gameOpen, setGameOpen] = useState(false)
  const [specialOpen, setSpecialOpen] = useState(false)
  const [specialTile, setSpecialTile] = useState(null)
  const [taunt] = useState(() => Math.random())

  const isOwned     = Boolean(selectedTile?.owner_univ)
  const isMyTile    = isOwned && user?.university && selectedTile?.owner_univ === user.university
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
    if (!isOwned)  return pickRandom(TAUNTS_EMPTY)
    if (isMyTile)  return pickRandom(TAUNTS_MINE)
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
      { gridId, university: user.university, level: Math.max(1, Number(result?.gameLevel || 1)), userId: user.id },
      {
        onSuccess: () => { console.log('[TileInfoPanel] occupy API completed:', { gridId }) },
        onError:   (error) => { console.error('[TileInfoPanel] occupy API failed:', { gridId, error: error?.message }) },
      }
    )
  }

  const handleClose = () => {
    setGameOpen(false)
    setSpecialOpen(false)
    setSpecialTile(null)
    setSelectedTile(null)
  }

  // game2 브랜치의 개선된 라벨 로직 적용
  const actionLabel = () => {
    if (isPending) return K.occupying
    if (selectedTile?.in_special_zone || selectedTile?.is_special) return K.specialMission
    if (!isOwned) return K.occupy
    if (isMyTile) return K.reinforce
    return K.steal
  }

  // ── 상태별 컬러 토큰 (HEAD 브랜치의 amber-coral 디자인 유지) ─────────────────
  const statusColors = isMyTile
    ? { chipBg: 'rgba(253,204,128,0.18)', chipText: '#8A5E14', tauntBg: 'rgba(253,204,128,0.13)', tauntText: '#8A5E14' }
    : isEnemyTile
    ? { chipBg: 'rgba(231,147,128,0.15)', chipText: '#B54030', tauntBg: 'rgba(231,147,128,0.10)', tauntText: '#B54030' }
    : { chipBg: 'rgba(218,172,93,0.14)',  chipText: '#7A5512', tauntBg: 'rgba(218,172,93,0.10)',  tauntText: '#7A5512' }

  return (
    <AnimatePresence>
      {selectedTile && (
        <MotionDiv
          key="tile-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="fixed left-1/2 -translate-x-1/2 bottom-[120px] w-[calc(100%-2rem)] max-w-[430px] z-[55] rounded-3xl bg-white pb-[max(env(safe-area-inset-bottom),16px)]"
          style={{
            maxHeight: '70dvh',
            boxShadow: '0 -2px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(235,184,101,0.20)',
          }}
        >
          <div className="overflow-y-auto px-5 pt-3.5 pb-2">

            {/* 드래그 핸들 (HEAD 유지) */}
            <div
              className="mx-auto mb-4 h-[3px] w-9 rounded-full"
              style={{ background: 'rgba(218,172,93,0.35)' }}
            />

            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {tileColor && (
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: tileColor,
                        boxShadow: `0 0 0 2.5px white, 0 0 0 4px ${tileColor}30`,
                      }}
                    />
                  )}
                  <h3
                    className="truncate text-[17px] font-extrabold leading-tight"
                    style={{ color: '#1C1009' }}
                  >
                    {isOwned ? `${selectedTile.owner_univ} ${K.territory}` : K.emptyTile}
                  </h3>
                </div>
                {/* game2에서 추가된 grid_id 표시 (디자인 톤 앤 매너 맞춤) */}
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: '#A08372' }}>
                  {selectedTile.grid_id}
                </p>
              </div>

              {/* game2에서 추가된 레벨 배지 (디자인 톤 앤 매너 맞춤) */}
              <span
                className="shrink-0 rounded-xl px-2.5 py-1 text-[13px] font-bold"
                style={
                  isOwned
                    ? { background: 'rgba(253,204,128,0.2)', color: '#B8710A' }
                    : { background: '#F5F0E8', color: '#A08372' }
                }
              >
                Lv.{selectedTile.level || 0}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold"
                style={{ background: statusColors.chipBg, color: statusColors.chipText }}
              >
                {isOwned
                  ? isMyTile ? `🏠 ${K.allyTerritory}` : `⚔️ ${K.enemyTerritory}`
                  : `🏳️ ${K.neutral}`}
              </span>

              {isAtTile && (
                <span
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold"
                  style={{ background: 'rgba(223,126,102,0.12)', color: '#DF7E66' }}
                >
                  📍 {K.currentPosition}
                </span>
              )}

              {selectedTile.is_special && (
                <span
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold"
                  style={{ background: 'rgba(235,184,101,0.14)', color: '#B8710A' }}
                >
                  ⭐ {K.special} {selectedTile.special_type || '3x3'}
                </span>
              )}
            </div>

            {/* ─── 자극 멘트 ─── */}
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-[13px] font-semibold leading-relaxed"
              style={{ background: statusColors.tauntBg, color: statusColors.tauntText }}
            >
              {tauntText}
            </div>

            {!isAtTile && (
              <div
                className="mb-4 rounded-2xl px-4 py-3 text-[12px] font-medium"
                style={{
                  background: 'rgba(235,184,101,0.10)',
                  color:      '#8A5E14',
                  border:     '1px solid rgba(235,184,101,0.22)',
                }}
              >
                📌 {K.moveToTileHint}
                {!location && K.enableLocationHint}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={handleStartMission}
                disabled={isPending || !isAtTile}
                className="flex-1 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
                style={{
                  background: isEnemyTile
                    ? 'linear-gradient(135deg, #E79380, #DF7E66)'
                    : 'linear-gradient(135deg, #FDCC80, #EBB865, #DF7E66)',
                  boxShadow: isEnemyTile
                    ? '0 6px 20px rgba(223,126,102,0.30)'
                    : '0 6px 20px rgba(235,184,101,0.32)',
                  color: isEnemyTile ? '#fff' : '#5C3100',
                }}
              >
                {actionLabel()}
              </button>
              <button
                onClick={handleClose}
                className="shrink-0 rounded-2xl px-5 py-3.5 text-[15px] font-bold transition-all active:scale-[0.97]"
                style={{ background: '#F5F0E8', color: '#8A7060' }}
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