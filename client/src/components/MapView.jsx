/**
 * 카카오맵 컴포넌트
 * ─────────────────
 * react-kakao-maps-sdk를 사용해 카카오맵을 렌더링한다.
 * 지도 위에 타일(폴리곤)을 그리고, 사용자 위치 마커를 표시한다.
 *
 * [참고] 카카오맵 SDK를 사용하려면 index.html에 카카오맵 스크립트를 추가하고
 *        발급받은 앱 키를 설정해야 한다. MVP에서는 플레이스홀더로 동작한다.
 */

import { useCallback, useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore'
import { useTiles, useOccupyTile } from '../hooks/useTiles'

// ─── 대학교별 색상 매핑 ─────────────────────────────────────
const UNIV_COLORS = {
  서울대학교: { fill: 'rgba(59, 130, 246, 0.35)', stroke: '#3b82f6' },
  연세대학교: { fill: 'rgba(239, 68, 68, 0.35)', stroke: '#ef4444' },
  고려대학교: { fill: 'rgba(168, 85, 247, 0.35)', stroke: '#a855f7' },
  default: { fill: 'rgba(107, 114, 128, 0.15)', stroke: '#6b7280' },
}

/**
 * 대학교 이름으로 색상 객체를 반환한다.
 * @param {string|null} univ - 대학교 이름
 * @returns {{ fill: string, stroke: string }}
 */
function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS.default
  return UNIV_COLORS[univ] || UNIV_COLORS.default
}

/**
 * 카카오맵 + 타일 오버레이를 렌더링하는 메인 맵 컴포넌트.
 *
 * @param {{ center: { lat: number, lng: number } }} props
 */
export default function MapView({ center }) {
  const mapRef = useRef(null)
  const setMapBounds = useGameStore((state) => state.setMapBounds)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)
  const { data: tiles } = useTiles()
  const occupyMutation = useOccupyTile()

  // ─── 지도 뷰포트가 바뀔 때 bounds 업데이트 ─────────────────
  const updateBounds = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const bounds = map.getBounds()
    if (!bounds) return

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    setMapBounds({
      minLat: sw.getLat(),
      maxLat: ne.getLat(),
      minLng: sw.getLng(),
      maxLng: ne.getLng(),
    })
  }, [setMapBounds])

  // ─── 카카오맵 초기화 ──────────────────────────────────────
  useEffect(() => {
    // window.kakao가 없으면 (SDK 미로드) 플레이스홀더만 표시
    if (!window.kakao || !window.kakao.maps) {
      console.warn(
        '[MapView] 카카오맵 SDK가 로드되지 않았습니다. ' +
          'index.html에 카카오맵 스크립트를 추가하세요.'
      )
      return
    }

    const container = document.getElementById('kakao-map')
    if (!container) return

    const options = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    }

    const map = new window.kakao.maps.Map(container, options)
    mapRef.current = map

    // 최초 bounds 설정
    updateBounds()

    // 지도 이동/줌 이벤트에 bounds 업데이트 연결
    window.kakao.maps.event.addListener(map, 'idle', updateBounds)

    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', updateBounds)
    }
  }, [center, updateBounds])

  // ─── 타일 폴리곤 그리기 ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tiles || !window.kakao?.maps) return

    const map = mapRef.current
    const polygons = []

    tiles.forEach((tile) => {
      const color = getUnivColor(tile.owner_univ)

      const path = tile.polygon.map(
        (p) => new window.kakao.maps.LatLng(p.lat, p.lng)
      )

      const polygon = new window.kakao.maps.Polygon({
        map,
        path,
        strokeWeight: 1,
        strokeColor: color.stroke,
        strokeOpacity: 0.8,
        fillColor: color.fill,
        fillOpacity: 1,
      })

      // 타일 클릭 이벤트
      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile)
      })

      polygons.push(polygon)
    })

    // 클린업: 기존 폴리곤 제거
    return () => {
      polygons.forEach((p) => p.setMap(null))
    }
  }, [tiles, setSelectedTile])

  return (
    <div className="relative h-full w-full">
      {/* 카카오맵 컨테이너 */}
      <div id="kakao-map" className="h-full w-full" />

      {/* 카카오맵 SDK 미로드 시 플레이스홀더 */}
      {(!window.kakao || !window.kakao.maps) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-light/90">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              지도 로딩 대기 중
            </h2>
            <p className="text-text-secondary text-sm max-w-xs">
              카카오맵 JavaScript SDK를 로드해주세요.
              <br />
              <code className="text-xs bg-surface px-2 py-1 rounded mt-2 inline-block">
                index.html에 카카오맵 스크립트 추가 필요
              </code>
            </p>

            {/* 현재 위치 & 타일 데이터 디버그 정보 */}
            {center && (
              <div className="mt-4 p-3 bg-surface rounded-lg text-xs text-text-secondary">
                <p>
                  현재 위치: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
                </p>
                {tiles && <p>로드된 타일 수: {tiles.length}개</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
