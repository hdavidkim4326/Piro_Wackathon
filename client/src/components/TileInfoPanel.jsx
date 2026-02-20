/**
 * 타일 정보 패널 컴포넌트
 * ──────────────────────
 * 사용자가 지도에서 타일을 탭하면 하단에 슬라이드업되는 패널.
 * 선택된 타일의 상세 정보와 점령 버튼을 표시한다.
 */

import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useOccupyTile } from '../hooks/useTiles'

/**
 * 선택된 타일의 정보를 보여주고 점령 액션을 제공하는 패널.
 */
export default function TileInfoPanel() {
  const selectedTile = useGameStore((state) => state.selectedTile)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)
  const user = useGameStore((state) => state.user)
  const { mutate: occupy, isPending } = useOccupyTile()

  /**
   * 점령 버튼 클릭 핸들러.
   * 현재 사용자의 대학교로 선택된 타일을 점령한다.
   */
  const handleOccupy = () => {
    if (!selectedTile) return

    const university = user?.university || '우리대학교'
    occupy(
      { gridId: selectedTile.grid_id, university },
      {
        onSuccess: () => setSelectedTile(null),
      }
    )
  }

  return (
    <AnimatePresence>
      {selectedTile && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 z-40 bg-surface-light border-t border-primary/30 rounded-t-2xl p-5 shadow-2xl"
        >
          {/* 핸들 바 (드래그 힌트) */}
          <div className="w-10 h-1 bg-text-secondary/30 rounded-full mx-auto mb-4" />

          {/* 타일 정보 */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {selectedTile.owner_univ
                  ? `${selectedTile.owner_univ} 영토`
                  : '비어있는 타일'}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {selectedTile.grid_id}
              </p>
            </div>

            {/* 레벨 뱃지 */}
            {selectedTile.level > 0 && (
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                Lv.{selectedTile.level}
              </span>
            )}
          </div>

          {/* 액션 버튼 영역 */}
          <div className="flex gap-3">
            <button
              onClick={handleOccupy}
              disabled={isPending}
              className="flex-1 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              {isPending ? '점령 중...' : '이 타일 점령하기'}
            </button>
            <button
              onClick={() => setSelectedTile(null)}
              className="px-4 py-3 bg-surface hover:bg-surface-light text-text-secondary rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
