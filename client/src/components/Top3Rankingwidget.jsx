import { motion } from "framer-motion";
import { useRanking } from "../hooks/useTiles";

const MotionDiv = motion.div;

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Top3RankingWidget() {
  const { data, isLoading } = useRanking(3);
  const top3 = Array.isArray(data) ? data.slice(0, 3) : [];

  return (
    <MotionDiv
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute right-4 top-32 z-30 w-[190px] rounded-2xl border border-white/60 bg-white/50 p-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
    >
      <p className="mb-2 text-xs font-extrabold text-slate-700">TOP 3 랭킹</p>

      {isLoading && (
        <p className="text-[11px] font-semibold text-slate-400">불러오는 중...</p>
      )}

      {!isLoading && top3.length === 0 && (
        <p className="text-[11px] font-semibold text-slate-400">데이터 없음</p>
      )}

      {!isLoading && top3.length > 0 && (
        <div className="space-y-1.5">
          {top3.map((row, idx) => (
            <div
              key={`${row.university}-${row.rank}-${idx}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-700">
                  {MEDALS[idx] || "🏅"} {row.university}
                </p>
              </div>
              <p className="text-[10px] font-semibold text-slate-500">
                {row.tile_count}칸
              </p>
            </div>
          ))}
        </div>
      )}
    </MotionDiv>
  );
}
