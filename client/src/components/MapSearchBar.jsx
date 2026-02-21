import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useKakaoLoader from "../hooks/useKakaoLoader";
import useKakaoPlaces from "../hooks/useKakaoPlaces";

const MotionDiv = motion.div;

export default function MapSearchBar({ onPickPlace }) {
  const kakaoReady = useKakaoLoader();
  const { loading, results, search, clear } = useKakaoPlaces(kakaoReady);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const canSearch = useMemo(
    () => kakaoReady && q.trim().length >= 2,
    [kakaoReady, q]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSearch) return;
    await search(q.trim());
    setOpen(true);
  };

  const onChangeQuery = (e) => {
    const next = e.target.value;
    setQ(next);
    if (!next.trim()) {
      clear();
      setOpen(false);
    }
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-[420px] items-center gap-3 rounded-[24px] border-2 border-[#ffe8cc] bg-white/95 px-5 py-3.5 shadow-md shadow-[#ff922b]/10 backdrop-blur-xl"
        style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-[#8d6e63]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>

        <input
          value={q}
          onChange={onChangeQuery}
          placeholder="장소/학교/건물명 검색"
          className="w-full bg-transparent text-[15px] font-bold text-[#5d4037] outline-none placeholder:text-[#adb5bd]"
        />

        <button
          type="submit"
          disabled={!canSearch}
          className="shrink-0 rounded-[14px] px-4 py-2 text-[14px] font-black text-white bg-gradient-to-r from-[#ffd8a8] to-[#ff922b] shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
          style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "1px" }}
        >
          {loading ? "검색중" : "검색"}
        </button>
      </form>

      <AnimatePresence>
        {open && (
          <>
            <MotionDiv
              className="fixed inset-0 z-[60] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <MotionDiv
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[32px] bg-white shadow-[0_-8px_30px_rgba(235,184,101,0.25)] border-t-2 border-[#ffe8cc] mx-auto w-full max-w-[420px]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)", fontFamily: "'Gowun Dodum', sans-serif" }}
            >
              <div className="px-5 pb-3 pt-5">
                <div className="mx-auto h-[4px] w-12 rounded-full bg-[#ffe8cc]" />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[18px] font-black text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif", letterSpacing: "1px" }}>검색 결과</p>
                    <p className="text-[12px] font-bold text-[#adb5bd]">
                      {results.length}개 찾음
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-[#fff4e6] px-4 py-2 text-[13px] font-bold text-[#8d6e63] active:bg-[#ffe8cc]"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <div className="max-h-[46vh] overflow-y-auto px-4 pb-4">
                {results.length === 0 ? (
                  <div className="px-2 py-10 text-center text-[14px] font-bold text-[#adb5bd]">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onPickPlace?.(p);
                          setOpen(false);
                        }}
                        className="w-full rounded-[20px] border border-[#ffe8cc] bg-[#fff9f0] px-5 py-4 text-left active:bg-[#ffe8cc] transition-colors shadow-sm"
                      >
                        <p className="text-[15px] font-extrabold text-[#5d4037]">
                          {p.name}
                        </p>
                        <p className="mt-1 text-[12px] font-bold text-[#8d6e63]">
                          {p.address}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#adb5bd]">
                          {p.category}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
