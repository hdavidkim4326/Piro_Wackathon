export default function Ranking() {
  // 원래 코드는 잠시 주석 처리!
  const { data: rankings, isLoading, isError } = useRanking()

  // 🥜 임의로 만든 귀여운 더미 데이터 (테스트용)
  // const rankings = [
  //   { rank: 1, university: "땅콩대학교", tile_count: 152 },
  //   { rank: 2, university: "아몬드대학교", tile_count: 130 },
  //   { rank: 3, university: "호두대학교", tile_count: 115 },
  //   { rank: 4, university: "피스타치오대", tile_count: 98 },
  //   { rank: 5, university: "마카다미아대", tile_count: 85 },
  //   { rank: 6, university: "캐슈넛대학교", tile_count: 72 },
  //   { rank: 7, university: "해바라기씨대", tile_count: 60 },
  //   { rank: 8, university: "잣대학교", tile_count: 45 },
  //   { rank: 9, university: "호박씨대학교", tile_count: 30 },
  //   { rank: 10, university: "헤이즐넛대학", tile_count: 12 },
  // ];
  // const isLoading = false;
  // const isError = false;
  //ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

  const first = rankings?.find((r) => r.rank === 1)
  const second = rankings?.find((r) => r.rank === 2)
  const third = rankings?.find((r) => r.rank === 3)
  const others = rankings?.filter((r) => r.rank > 3) || []

  return (
    <div
      className="h-full overflow-y-auto bg-[#fff9f0] pb-32"
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >
      <header className="sticky top-0 z-20 border-b-[3px] border-[#ffd8a8] bg-[#fff9f0]/90 px-5 py-5 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-2">
          <span className="text-3xl drop-shadow-md">🥜</span>
          <h1
            className="text-center text-3xl font-black tracking-widest text-[#d9480f]"
            style={{
              fontFamily: "'MemomentKkukkukk', sans-serif",
              textShadow: "2px 2px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff"
            }}
          >
            이달의 랭킹
          </h1>
          <span className="text-3xl drop-shadow-md">🥜</span>
        </div>
      </header>

      <div className="mx-auto max-w-lg">
        {isLoading && (
          <div className="py-20 text-center font-bold text-[#8d6e63]">
            땅콩 랭킹을 불러오는 중... 🥜
          </div>
        )}
        {isError && (
          <div className="py-20 text-center font-bold text-[#f03e3e]">
            💦 랭킹을 불러오지 못했어요.
          </div>
        )}
        {!isLoading && !isError && rankings?.length === 0 && (
          <div className="py-20 text-center font-bold text-[#8d6e63]">
            아직 점령된 대학교가 없어요!
          </div>
        )}

        {/* 🏆 탑 3 시상대 영역 */}
        {!isLoading && !isError && rankings?.length > 0 && (
          <div className="flex items-end justify-center gap-3 px-4 pt-10 pb-8">
            {second ? (
              <div className="flex w-24 flex-col items-center">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#ffe8cc] bg-white text-2xl shadow-sm">
                  🏫
                </div>
                <div className="flex h-32 w-full flex-col items-center justify-start rounded-t-2xl bg-[#ffe8cc] pt-3 shadow-md">
                  <span className="text-xl font-bold text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>2위</span>
                  <span className="w-full truncate px-1 text-center text-sm font-bold text-[#5d4037]">{second.university}</span>
                  <span className="mt-1 text-xs font-semibold text-[#8d6e63]">{second.tile_count} 땅콩</span>
                </div>
              </div>
            ) : <div className="w-24"></div>}

            {first && (
              <div className="flex w-28 flex-col items-center">
                <div className="z-10 mb-[-10px] text-3xl">👑</div>
                <div className="z-10 mb-2 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#ff922b] bg-white text-3xl shadow-md">
                  🥜
                </div>
                <div className="flex h-40 w-full flex-col items-center justify-start rounded-t-2xl bg-gradient-to-t from-[#ffd8a8] to-[#ff922b] pt-4 shadow-lg">
                  <span className="text-2xl font-bold text-white drop-shadow-md" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>1위</span>
                  <span className="mt-1 w-full truncate px-1 text-center text-base font-extrabold text-[#5d4037]">{first.university}</span>
                  <span className="mt-1 text-sm font-bold text-white">{first.tile_count} 땅콩</span>
                </div>
              </div>
            )}

            {third ? (
              <div className="flex w-24 flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#ffe8cc] bg-white text-xl shadow-sm">
                  🏫
                </div>
                <div className="flex h-24 w-full flex-col items-center justify-start rounded-t-2xl bg-[#ffe8cc] pt-2 shadow-md">
                  <span className="text-xl font-bold text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>3위</span>
                  <span className="w-full truncate px-1 text-center text-sm font-bold text-[#5d4037]">{third.university}</span>
                  <span className="mt-1 text-xs font-semibold text-[#8d6e63]">{third.tile_count} 땅콩</span>
                </div>
              </div>
            ) : <div className="w-24"></div>}
          </div>
        )}

        {/* 📋 4위 이하 리스트 영역 */}
        {/* 💡 수정됨: 하단 네비게이션 바에 가리지 않도록 pb-10을 pb-36으로 대폭 늘렸습니다! */}
        <div className="flex flex-col gap-3 pb-36 w-full items-center">
          {others.map((item) => (
            <div
              key={item.rank}
              className="flex w-[85%] max-w-[400px] items-center rounded-2xl border-2 border-[#ffe8cc] bg-white p-3 shadow-md transition-transform active:scale-95"
            >
              <div
                className="w-10 text-center text-xl font-bold text-[#d9480f]"
                style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}
              >
                {item.rank}
              </div>

              <div className="mx-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ffe8cc] bg-[#fff4e6] text-xl">
                🏫
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-lg font-bold text-[#5d4037]">
                  {item.university}
                </span>
                <span className="text-sm font-semibold text-[#8d6e63]">
                  {item.tile_count} 땅콩
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-28 w-full shrink-0"></div>

      </div>
    </div>
  )
}