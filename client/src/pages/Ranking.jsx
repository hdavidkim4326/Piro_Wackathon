import { useRanking } from '../hooks/useTiles'

export default function Ranking() {
  const { data: rankings, isLoading, isError } = useRanking()

  // 🥇 1~3위 데이터와 🥈 나머지(4위~) 데이터를 분리합니다.
  const first = rankings?.find((r) => r.rank === 1)
  const second = rankings?.find((r) => r.rank === 2)
  const third = rankings?.find((r) => r.rank === 3)
  const others = rankings?.filter((r) => r.rank > 3) || []

  return (
    // 전체 배경을 땅콩 테마의 베이지색으로 맞추고, 기본 폰트를 '고운 돋움'으로 설정합니다.
    <div 
      className="h-full overflow-y-auto bg-[#fff9f0] pb-28" 
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >
      {/* 📌 상단 헤더 */}
      <header className="sticky top-0 z-20 border-b border-[#ffe8cc] bg-[#fff9f0]/80 px-5 py-4 backdrop-blur-md">
        <h1 
          className="mx-auto max-w-lg text-center text-2xl text-[#5d4037]"
          style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}
        >
          🥜 이달의 랭킹
        </h1>
      </header>

      <div className="mx-auto max-w-lg">
        {/* ⏳ 로딩 및 에러 처리 */}
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

        {/* 🏆 탑 3 시상대 (Podium) 영역 */}
        {!isLoading && !isError && rankings?.length > 0 && (
          <div className="flex items-end justify-center gap-3 px-4 pt-10 pb-8">
            
            {/* 🥈 2위 */}
            {second ? (
              <div className="flex w-24 flex-col items-center">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#ffe8cc] bg-white text-2xl shadow-sm">
                  🏫
                </div>
                <div className="flex h-32 w-full flex-col items-center justify-start rounded-t-2xl bg-[#ffe8cc] pt-3 shadow-md">
                  <span className="text-xl font-bold text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>2위</span>
                  <span className="w-full truncate px-1 text-center text-sm font-bold text-[#5d4037]">{second.university}</span>
                  <span className="text-xs font-semibold text-[#8d6e63] mt-1">{second.tile_count} 땅콩</span>
                </div>
              </div>
            ) : <div className="w-24"></div>}

            {/* 🥇 1위 (가장 높고 화려하게!) */}
            {first && (
              <div className="flex w-28 flex-col items-center">
                <div className="mb-[-10px] text-3xl z-10">👑</div>
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#ff922b] bg-white text-3xl shadow-md z-10">
                  🥜
                </div>
                <div className="flex h-40 w-full flex-col items-center justify-start rounded-t-2xl bg-gradient-to-t from-[#ffd8a8] to-[#ff922b] pt-4 shadow-lg">
                  <span className="text-2xl font-bold text-white drop-shadow-md" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>1위</span>
                  <span className="w-full truncate px-1 text-center text-base font-extrabold text-[#5d4037] mt-1">{first.university}</span>
                  <span className="text-sm font-bold text-white mt-1">{first.tile_count} 땅콩</span>
                </div>
              </div>
            )}

            {/* 🥉 3위 */}
            {third ? (
              <div className="flex w-24 flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#ffe8cc] bg-white text-xl shadow-sm">
                  🏫
                </div>
                <div className="flex h-24 w-full flex-col items-center justify-start rounded-t-2xl bg-[#ffe8cc] pt-2 shadow-md">
                  <span className="text-xl font-bold text-[#d9480f]" style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}>3위</span>
                  <span className="w-full truncate px-1 text-center text-sm font-bold text-[#5d4037]">{third.university}</span>
                  <span className="text-xs font-semibold text-[#8d6e63] mt-1">{third.tile_count} 땅콩</span>
                </div>
              </div>
            ) : <div className="w-24"></div>}

          </div>
        )}

        {/* 📋 4위 이하 리스트 영역 */}
        <div className="flex flex-col gap-3 px-5 pb-10">
          {others.map((item) => (
            <div
              key={item.rank}
              className="flex items-center rounded-2xl border-2 border-[#ffe8cc] bg-white p-3 shadow-sm transition-transform active:scale-95"
            >
              {/* 순위 */}
              <div 
                className="w-10 text-center text-xl font-bold text-[#d9480f]"
                style={{ fontFamily: "'MemomentKkukkukk', sans-serif" }}
              >
                {item.rank}
              </div>
              
              {/* 로고 (현재는 임시 이모지) */}
              <div className="mx-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4e6] text-xl border border-[#ffe8cc]">
                🏫
              </div>
              
              {/* 대학교 이름 & 점령 수 */}
              <div className="flex flex-1 flex-col">
                <span className="text-lg font-bold text-[#5d4037]">
                  {item.university}
                </span>
                <span className="text-sm font-semibold text-[#8d6e63]">
                  {item.tile_count} 땅콩
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}