/**
 * 타일 정보 바텀 시트
 * ─────────────────────
 * 지도에서 타일을 탭하면 올라오는 패널.
 * 현재 위치 타일에서만 점령/강화/빼앗기 가능.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { useOccupyTile } from '../hooks/useTiles'
import TileGameModal from './TileGameModal'

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MotionDiv = motion.div

function calcGridId(lat, lng) {
  return `grid_${Math.floor(lat / LAT_STEP)}_${Math.floor(lng / LNG_STEP)}`
}

const UNIV_DOT_COLORS = {
  서울대학교: '#3b82f6',
  연세대학교: '#0ea5e9',
  고려대학교: '#ef4444',
  우리대학교: '#a855f7',
}

const TAUNTS_EMPTY = [
  '주인 없는 땅이다! 콩! 하고 점령해버려 🥜',
  '이 땅은 너를 기다리고 있었어!',
  '빈 땅 발견! 선점하면 전설이 된다 💥',
  '아직 아무도 안 왔다... 지금이 기회!',
]

const TAUNTS_ENEMY = [
  '여기가 감히 누구 땅이라고? 뺏어!',
  '적의 영토 한복판이다... 콩! 💣',
  '이 색깔 맘에 안 든다. 바꾸자!',
  '적에게 빼앗기면 우리가 빼앗으면 돼!',
]

const TAUNTS_MINE = [
  '우리 땅! 강화해서 철벽 방어하자 🛡️',
  '잘 지키고 있지? 레벨업 가자!',
  '이 타일은 우리가 먹었다 😤✌️',
]

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
    ? (UNIV_DOT_COLORS[selectedTile.owner_univ.trim()] || '#f97316')
    : null

  const tauntText = useMemo(() => {
    if (!selectedTile) return ''
    if (!isOwned) return pickRandom(TAUNTS_EMPTY)
    if (isMyTile) return pickRandom(TAUNTS_MINE)
    return pickRandom(TAUNTS_ENEMY)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTile?.grid_id, taunt])

  const handleStartMission = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setGameOpen(true)
  }

  const handleMissionSuccess = (gridId, result = null) => {
    if (!gridId || !user) return

    console.log('[TileInfoPanel] handleMissionSuccess:', {
      gridId,
      gameId: result?.gameId,
      success: result?.success,
    })

    // 성공 즉시 게임 모달을 닫고, 점령 API 체인으로 넘긴다.
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
    setSelectedTile(null)
  }

  const actionLabel = () => {
    if (isPending) return '점령 중...'
    if (!isOwned) return '점령하기'
    if (isMyTile) return '강화하기'
    return '땅 빼앗기!'
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
            {/* 드래그 핸들 */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

            {/* ─── 헤더: 타일 이름 + 레벨 ─── */}
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
                    {isOwned ? `${selectedTile.owner_univ} 영토` : '빈 땅'}
                  </h3>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  {selectedTile.grid_id}
                </p>
              </div>

              <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[13px] font-bold ${
                isOwned ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                Lv.{selectedTile.level || 0}
              </span>
            </div>

            {/* ─── 상태 정보 칩 ─── */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                isOwned
                  ? isMyTile
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-500'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {isOwned
                  ? isMyTile ? '🏠 아군 영토' : '⚔️ 적군 영토'
                  : '🏳️ 미점령'
                }
              </span>

              {isAtTile && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                  📍 현재 위치
                </span>
              )}

              {selectedTile.is_special && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                  ⭐ 특수 {selectedTile.special_type || '3x3'}
                </span>
              )}
            </div>

            {/* ─── 자극 멘트 ─── */}
            <div className={`mb-4 rounded-2xl px-4 py-3 text-[13px] font-semibold leading-relaxed ${
              isEnemyTile
                ? 'bg-rose-50 text-rose-600'
                : isMyTile
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-indigo-50 text-indigo-600'
            }`}>
              {tauntText}
            </div>

            {/* ─── 위치 안내 (현재 타일 아닐 때) ─── */}
            {!isAtTile && (
              <div className="mb-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px] font-medium text-slate-500">
                📌 이 타일로 이동해야 점령할 수 있어요.
                {!location && ' (위치를 먼저 켜주세요)'}
              </div>
            )}

            {/* ─── 액션 버튼 ─── */}
            <div className="flex gap-2.5">
              <button
                onClick={handleStartMission}
                disabled={isPending || !isAtTile}
                className={`flex-1 rounded-2xl px-4 py-3.5 text-[15px] font-bold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:shadow-none ${
                  isEnemyTile
                    ? 'bg-rose-500 shadow-rose-500/20'
                    : 'bg-indigo-600 shadow-indigo-600/20'
                }`}
              >
                {actionLabel()}
              </button>
              <button
                onClick={handleClose}
                className="shrink-0 rounded-2xl bg-slate-100 px-5 py-3.5 text-[15px] font-bold text-slate-500 transition-all active:scale-[0.97] active:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </div>
        </MotionDiv>
      )}

      {/* 미니게임 모달 */}
      {gameOpen && selectedTile && (
        <TileGameModal
          key={selectedTile.grid_id}
          tile={selectedTile}
          onClose={() => setGameOpen(false)}
          onMissionSuccess={handleMissionSuccess}
        />
      )}
    </AnimatePresence>
  )
}
