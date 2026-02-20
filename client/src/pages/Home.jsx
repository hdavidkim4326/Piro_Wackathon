/**
 * 홈(지도) 페이지
 * ───────────────
 * 앱의 메인 화면. GPS로 현재 위치를 받아와서 카카오맵을 렌더링하고,
 * 지도 위에 점령 타일들을 표시한다.
 */

import { useGeolocation } from '../hooks/useGeolocation'
import MapView from '../components/MapView'
import TileInfoPanel from '../components/TileInfoPanel'
import useGameStore from '../store/gameStore'
import { useTiles } from '../hooks/useTiles'

// ─── 기본 위치: 서울 시청 (GPS 미수신 시 사용) ──────────────
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/**
 * 홈 페이지 컴포넌트.
 * GPS 위치를 받아와 지도를 중심에 배치하고, 타일 정보를 표시한다.
 */
export default function Home() {
  const { location, error, loading } = useGeolocation()
  const mapBounds = useGameStore((state) => state.mapBounds)
  const { data: tiles, isLoading: tilesLoading } = useTiles()

  // GPS 위치가 있으면 그걸 쓰고, 없으면 기본 위치 사용
  const center = location || DEFAULT_CENTER

  return (
    <div className="h-full flex flex-col">
      {/* 상단 헤더 바 */}
      <header className="flex-shrink-0 bg-surface/80 backdrop-blur-md border-b border-surface-light px-4 py-3 z-30">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-primary">
            Campus Turf War
          </h1>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {loading && (
              <span className="flex items-center gap-1">
                <span className="animate-pulse w-2 h-2 bg-secondary rounded-full" />
                위치 수신 중...
              </span>
            )}
            {error && (
              <span className="text-danger text-xs">{error}</span>
            )}
            {!loading && !error && location && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full" />
                GPS 연결됨
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 지도 영역 (남은 공간 전부 차지, 하단 네비 높이만큼 패딩) */}
      <main className="flex-1 relative pb-16">
        <MapView center={center} />

        {/* 타일 로딩 인디케이터 */}
        {tilesLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-text-secondary">
            타일 데이터 로딩 중...
          </div>
        )}

        {/* 타일 정보 팝업 패널 */}
        <TileInfoPanel />
      </main>
    </div>
  )
}
