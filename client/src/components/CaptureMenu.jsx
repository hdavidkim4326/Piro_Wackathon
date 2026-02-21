// src/components/CaptureMenu.jsx
import { AnimatePresence, motion } from "framer-motion";

export default function CaptureMenu({ open, onClose, onQuick, onChallenge }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 right-0 bottom-16 z-60 rounded-t-3xl bg-white p-5 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={onChallenge}
                className="rounded-2xl bg-slate-100 text-slate-700 font-extrabold py-4 active:bg-slate-200"
              >
                점령하기
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-2xl bg-white border border-slate-200 text-slate-500 font-extrabold py-3 active:bg-slate-50"
            >
              닫기
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}