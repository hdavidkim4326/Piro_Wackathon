/**
 * 카카오맵 컴포넌트
 * ─────────────────
 * 카카오맵 SDK를 사용해 지도를 렌더링하고,
 * 타일(폴리곤)과 사용자 위치 마커를 표시한다.
 *
 * SDK 미로드 시에는 라이트 테마 플레이스홀더를 보여준다.
 */

import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useTiles, useOccupyTile } from '../hooks/useTiles'

// ─── 대학교별 폴리곤 색상 매핑 ──────────────────────────────
const UNIV_COLORS = {
  서울대학교: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6' },
  연세대학교: { fill: 'rgba(56, 189, 248, 0.3)', stroke: '#38bdf8' },
  고려대학교: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' },
  default: { fill: 'rgba(148, 163, 184, 0.12)', stroke: '#cbd5e1' },
}

/**
 * 대학교 이름으로 폴리곤 색상을 반환한다.
 * @param {string|null} univ
 */
function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS.default
  return UNIV_COLORS[univ] || UNIV_COLORS.default
}

/**
 * 카카오맵 + 타일 오버레이를 렌더링하는 메인 맵 컴포넌트.
 * @param {{ center: { lat: number, lng: number } }} props
 */
export default function MapView({ center }) {
  const mapRef = useRef(null)
  const setMapBounds = useGameStore((s) => s.setMapBounds)
  const setSelectedTile = useGameStore((s) => s.setSelectedTile)
  const { data: tiles } = useTiles()

  // ─── 뷰포트 bounds 업데이트 ───────────────────────────────
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
    if (!window.kakao || !window.kakao.maps) return

    const container = document.getElementById('kakao-map')
    if (!container) return

    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    })
    mapRef.current = map
    updateBounds()

    window.kakao.maps.event.addListener(map, 'idle', updateBounds)
    return () => {
      window.kakao.maps.event.removeListener(map, 'idle', updateBounds)
    }
  }, [center, updateBounds])

  // ─── 타일 폴리곤 렌더링 ───────────────────────────────────
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
        strokeOpacity: 0.7,
        fillColor: color.fill,
        fillOpacity: 1,
      })

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile)
      })

      polygons.push(polygon)
    })

    return () => polygons.forEach((p) => p.setMap(null))
  }, [tiles, setSelectedTile])

  // ─── 카카오맵 SDK가 있으면 지도 컨테이너만 렌더링 ──────────
  if (window.kakao && window.kakao.maps) {
    return <div id="kakao-map" className="absolute inset-0" />
  }

  // ─── SDK 미로드: 라이트 모드 플레이스홀더 ──────────────────
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
      {/* 배경 장식 — 그리드 패턴 느낌 */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, delay: 0.2 }}
        className="relative z-10 text-center px-8"
      >
        {/* 둥근 아이콘 */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg shadow-indigo-500/10 border border-white/60 flex items-center justify-center text-4xl"
        >
          🗺️
        </motion.div>

        <h2 className="text-xl font-extrabold text-slate-700 tracking-tight mb-2">
          지도 로딩 대기중
        </h2>
        <p className="text-sm text-slate-400 font-medium max-w-[260px] mx-auto leading-relaxed">
          카카오맵 JavaScript SDK를 
          <code className="text-xs bg-white/80 text-indigo-500 px-1.5 py-0.5 rounded-md font-semibold mx-0.5">
            index.html
          </code>
          에 추가해주세요
        </p>

        {/* 디버그 정보 */}
        {center && (
          <div className="mt-5 inline-flex flex-col gap-1 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 text-[11px] font-medium text-slate-400">
            <span>
              📍 {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
            </span>
            {tiles && (
              <span>📦 타일 {tiles.length}개 로드됨</span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
