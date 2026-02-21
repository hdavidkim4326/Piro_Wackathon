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
        className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-5 py-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-slate-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>

        <input
          value={q}
          onChange={onChangeQuery}
          placeholder="장소/학교/건물명 검색"
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!canSearch}
          className="shrink-0 rounded-lg px-2 py-2 text-xs font-extrabold text-indigo-600 active:bg-indigo-50 disabled:opacity-40 whitespace-nowrap"
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
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-white shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
            >
              <div className="px-5 pb-3 pt-4">
                <div className="mx-auto h-1 w-12 rounded-full bg-slate-200" />
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">검색 결과</p>
                    <p className="text-[12px] font-semibold text-slate-400">
                      {results.length}개
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2 text-[12px] font-extrabold text-slate-500 active:bg-slate-100"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <div className="max-h-[46vh] overflow-y-auto px-4 pb-4">
                {results.length === 0 ? (
                  <div className="px-2 py-10 text-center text-[13px] font-semibold text-slate-400">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onPickPlace?.(p);
                          setOpen(false);
                        }}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left active:bg-slate-100"
                      >
                        <p className="text-[13px] font-extrabold text-slate-900">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                          {p.address}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
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
