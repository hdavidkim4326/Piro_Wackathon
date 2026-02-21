import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useKakaoLoader from "../hooks/useKakaoLoader";
import useKakaoPlaces from "../hooks/useKakaoPlaces";

export default function MapSearchBar({ onPickPlace }) {
  const kakaoReady = useKakaoLoader();
  const { loading, results, search, clear } = useKakaoPlaces(kakaoReady);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const canSearch = useMemo(() => kakaoReady && q.trim().length >= 2, [kakaoReady, q]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSearch) return;
    await search(q.trim());
    setOpen(true);
  };

  useEffect(() => {
    if (!q.trim()) {
      clear();
      setOpen(false);
    }
  }, [q]);

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg shadow-slate-900/5 border border-white/60 flex items-center gap-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-slate-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="장소/학교/역 이름 검색"
          className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!canSearch}
          className="text-xs font-extrabold text-indigo-600 px-2 py-1 rounded-lg active:bg-indigo-50 disabled:opacity-40"
        >
          {loading ? "검색중" : "검색"}
        </button>
      </form>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
            >
              <div className="px-5 pt-4 pb-3">
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
                    className="text-[12px] font-extrabold text-slate-500 px-3 py-2 rounded-xl active:bg-slate-100"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <div className="max-h-[46vh] overflow-y-auto px-4 pb-4">
                {results.length === 0 ? (
                  <div className="px-2 py-10 text-center text-[13px] font-semibold text-slate-400">
                    결과가 없어. 검색어를 바꿔봐.
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
                        className="w-full text-left rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 active:bg-slate-100"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}