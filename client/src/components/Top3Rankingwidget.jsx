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
      className="absolute right-4 top-[125px] z-30 w-[180px] rounded-[24px] border-2 border-[#ffe8cc] bg-white/95 p-3.5 shadow-md shadow-[#ff922b]/10 backdrop-blur-xl"
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >
      <p className="mb-2.5 text-[15px] font-black text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "1px" }}>TOP 3 랭킹</p>

      {isLoading && (
        <p className="text-[12px] font-bold text-[#adb5bd]">불러오는 중...</p>
      )}

      {!isLoading && top3.length === 0 && (
        <p className="text-[12px] font-bold text-[#adb5bd]">데이터 없음</p>
      )}

      {!isLoading && top3.length > 0 && (
        <div className="space-y-2">
          {top3.map((row, idx) => (
            <div
              key={`${row.university}-${row.rank}-${idx}`}
              className="flex items-center justify-between rounded-[14px] bg-[#fff9f0] border border-[#ffe8cc] px-2.5 py-2"
            >
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="text-[13px]">{MEDALS[idx] || "🏅"}</span>
                <p className="truncate text-[12px] font-bold text-[#5d4037]">
                  {row.university}
                </p>
              </div>
              <p className="text-[11px] font-black text-[#ff922b]">
                {row.tile_count}칸
              </p>
            </div>
          ))}
        </div>
      )}
    </MotionDiv>
  );
}
