import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import useGameStore from '../store/gameStore'
import { useOccupyTile } from '../hooks/useTiles'
import TileGameModal from './TileGameModal'

const MotionPanel = motion.div

export default function TileInfoPanel() {
  const selectedTile = useGameStore((state) => state.selectedTile)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)
  const user = useGameStore((state) => state.user)
  const { mutate: occupy, isPending } = useOccupyTile()
  const [gameOpen, setGameOpen] = useState(false)

  const handleGameSuccess = (result) => {
    if (!selectedTile) return

    const university = user?.university || '우리대학교'
    occupy(
      {
        gridId: selectedTile.grid_id,
        university,
        level: Math.max(1, Number(result?.gameLevel || 1)),
      },
      {
        onSuccess: () => {
          setGameOpen(false)
          setSelectedTile(null)
        },
      }
    )
  }

  return (
    <AnimatePresence>
      {selectedTile && (
        <MotionPanel
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 z-40 rounded-t-2xl border-t border-primary/30 bg-surface-light p-5 shadow-2xl"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-text-secondary/30" />

          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {selectedTile.owner_univ
                  ? `${selectedTile.owner_univ} territory`
                  : 'Unoccupied tile'}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">{selectedTile.grid_id}</p>
            </div>

            <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary">
              Lv.{selectedTile.level || 0}
            </span>
          </div>

          {selectedTile.is_special && (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              Special Tile: {selectedTile.special_type || '3x3'}
            </div>
          )}

          {!selectedTile.is_special && selectedTile.in_special_zone && (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              Special Zone ({selectedTile.special_zone_type || '3x3'}) - Center:{' '}
              {selectedTile.special_center_grid_id || '-'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setGameOpen(true)}
              disabled={isPending}
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {isPending ? 'Occupying...' : 'Start Mission'}
            </button>
            <button
              onClick={() => {
                setGameOpen(false)
                setSelectedTile(null)
              }}
              className="rounded-xl bg-surface px-4 py-3 font-bold text-text-secondary"
            >
              Close
            </button>
          </div>
        </MotionPanel>
      )}

      {gameOpen && selectedTile && (
        <TileGameModal
          tile={selectedTile}
          onClose={() => setGameOpen(false)}
          onSuccess={handleGameSuccess}
        />
      )}
    </AnimatePresence>
  )
}
