import { AnimatePresence, motion } from 'framer-motion'
import useGameStore from '../store/gameStore'

const MotionPanel = motion.div

export default function TileInfoPanel() {
  const selectedTile = useGameStore((state) => state.selectedTile)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)

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
                Frontend grid cell
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                {selectedTile.grid_id}
              </p>
            </div>

            <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary">
              30m x 30m
            </span>
          </div>

          <p className="mb-4 text-xs text-text-secondary">
            Occupy API is disabled for now. Backend integration comes next.
          </p>

          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 cursor-not-allowed rounded-xl bg-surface px-4 py-3 font-bold text-text-secondary/60"
            >
              Occupy (coming soon)
            </button>
            <button
              onClick={() => setSelectedTile(null)}
              className="rounded-xl bg-primary px-4 py-3 font-bold text-white"
            >
              Close
            </button>
          </div>
        </MotionPanel>
      )}
    </AnimatePresence>
  )
}
