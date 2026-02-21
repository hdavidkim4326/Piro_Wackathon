// src/components/HoldToCaptureOverlay.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useGameStore from "../store/gameStore";
import { useOccupyTile } from "../hooks/useTiles";

const HOLD_MS = 10000;

const UNIV_COLORS = {
  서울대학교: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.40)" },
  연세대학교: { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.40)" },
  고려대학교: { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.40)" },
  default: { stroke: "#6366f1", fill: "rgba(99, 102, 241, 0.25)" },
};

function getUnivStroke(univ) {
  return (UNIV_COLORS[univ] || UNIV_COLORS.default).stroke;
}

export default function HoldToCaptureOverlay({ open, onClose, gridId }) {
  const user = useGameStore((s) => s.user);
  const { mutateAsync, isPending } = useOccupyTile();

  const stroke = useMemo(() => getUnivStroke(user?.university), [user?.university]);

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0~1
  const startAtRef = useRef(null);
  const rafRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setHolding(false);
      setProgress(0);
      startAtRef.current = null;
      finishedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [open]);

  const stop = () => {
    setHolding(false);
    setProgress(0);
    startAtRef.current = null;
    finishedRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const tick = async (now) => {
    if (!startAtRef.current) startAtRef.current = now;
    const elapsed = now - startAtRef.current;
    const p = Math.max(0, Math.min(1, elapsed / HOLD_MS));
    setProgress(p);

    if (p >= 1 && !finishedRef.current) {
      finishedRef.current = true;
      setHolding(false);

      // 실제 점령 요청
      try {
        if (!user) {
          alert("로그인 먼저 해야 점령할 수 있어. 마이페이지에서 로그인해.");
          onClose();
          return;
        }
        if (!gridId) {
          alert("현재 위치 grid 계산이 아직 안 됐어. GPS 잡히면 다시 눌러.");
          onClose();
          return;
        }

        await mutateAsync({
          gridId,
          university: user.university,
          level: 1,
        });

        onClose();
      } catch (e) {
        alert("점령 실패. 네트워크/서버 상태 확인해.");
        stop();
      }
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (isPending) return;
    if (!user) {
      alert("로그인 먼저 해야 점령할 수 있어. 마이페이지에서 로그인해.");
      onClose();
      return;
    }
    if (!gridId) {
      alert("현재 위치 grid 계산이 아직 안 됐어. GPS 잡히면 다시 눌러.");
      onClose();
      return;
    }

    setHolding(true);
    setProgress(0);
    startAtRef.current = null;
    finishedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);
  };

  const onPointerUpOrCancel = () => {
    if (!holding) return;
    stop();
  };

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (holding) return; // 홀드 중 실수로 닫히는 거 방지
              onClose();
            }}
          />

          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center px-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-6">
              <p className="text-base font-extrabold text-slate-900">
                땅을 점령하려면 10초간 눌러주세요
              </p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                손을 떼면 취소돼. (grid: {gridId || "대기"})
              </p>

              <div className="mt-6 flex items-center justify-center">
                <button
                  disabled={isPending}
                  onPointerDown={start}
                  onPointerUp={onPointerUpOrCancel}
                  onPointerCancel={onPointerUpOrCancel}
                  onPointerLeave={onPointerUpOrCancel}
                  className="relative w-32 h-32 rounded-full select-none touch-none
                             bg-slate-900 text-white font-extrabold
                             flex items-center justify-center
                             active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background: holding ? stroke : "#0f172a",
                  }}
                >
                  <span className="text-sm">
                    {isPending ? "점령 중..." : holding ? "유지중" : "홀드"}
                  </span>

                  {/* progress ring */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => {
                  if (holding) return;
                  onClose();
                }}
                className="mt-6 w-full rounded-2xl bg-slate-100 text-slate-700 font-extrabold py-3 active:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}