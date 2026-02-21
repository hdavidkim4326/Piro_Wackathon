/**
 * 카카오맵 컴포넌트 (병합 완료)
 * ────────────────────────────
 * [팀원 로직] kakao.maps.load() 분기, buildViewportTiles 클라이언트 그리드 계산,
 *            overlaysRef 일괄 관리, 마커, idle 이벤트, cleanup
 * [내 디자인] 라이트 글래스모피즘 플레이스홀더, 대학교별 컬러, framer-motion 애니메이션
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'

const MotionDiv = motion.div

// ─── 그리드 크기 상수 (도 단위, ~30m) ───────────────────────
const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MAX_VISIBLE_TILES = 1200

// ─── 대학교별 폴리곤 색상 ───────────────────────────────────
const UNIV_COLORS = {
  서울대학교: { fill: 'rgba(59, 130, 246, 0.30)', stroke: '#3b82f6' },
  연세대학교: { fill: 'rgba(56, 189, 248, 0.30)', stroke: '#38bdf8' },
  고려대학교: { fill: 'rgba(239, 68, 68, 0.30)', stroke: '#ef4444' },
  default: { fill: 'rgba(107, 114, 128, 0.08)', stroke: '#6b7280' },
}

/** @param {string|null} univ */
function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS.default
  return UNIV_COLORS[univ] || UNIV_COLORS.default
}

/**
 * 뷰포트 bounds로부터 클라이언트에서 직접 타일 목록을 계산한다.
 * 서버 없이도 그리드 격자를 즉시 렌더링할 수 있다.
 */
function buildViewportTiles(bounds) {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  const minLat = sw.getLat()
  const maxLat = ne.getLat()
  const minLng = sw.getLng()
  const maxLng = ne.getLng()

  const rowStart = Math.floor(minLat / LAT_STEP)
  const rowEnd = Math.floor(maxLat / LAT_STEP)

  const tiles = []

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const south = row * LAT_STEP
    const north = south + LAT_STEP

    const colStart = Math.floor(minLng / LNG_STEP)
    const colEnd = Math.floor(maxLng / LNG_STEP)

    for (let col = colStart; col <= colEnd; col += 1) {
      const west = col * LNG_STEP
      const east = west + LNG_STEP

      tiles.push({
        grid_id: `grid_${row}_${col}`,
        owner_univ: null,
        level: 0,
        polygon: [
          { lat: south, lng: west },
          { lat: north, lng: west },
          { lat: north, lng: east },
          { lat: south, lng: east },
        ],
      })

      if (tiles.length >= MAX_VISIBLE_TILES) return tiles
    }
  }

  return tiles
}

/**
 * 카카오맵 + 타일 폴리곤 렌더링 컴포넌트.
 * @param {{ center: { lat: number, lng: number } }} props
 */
export default function MapView({ center }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const idleHandlerRef = useRef(null)
  const markerRef = useRef(null)

  const [mapReady, setMapReady] = useState(Boolean(window.kakao?.maps))
  const [tileCount, setTileCount] = useState(0)

  const setMapBounds = useGameStore((s) => s.setMapBounds)
  const setSelectedTile = useGameStore((s) => s.setSelectedTile)

  /** 기존 폴리곤 오버레이 전부 제거 */
  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((p) => p.setMap(null))
    overlaysRef.current = []
  }, [])

  /** 현재 뷰포트 기준으로 그리드를 계산하고 폴리곤을 다시 그린다 */
  const renderGrid = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return

    const map = mapRef.current
    const bounds = map.getBounds()
    if (!bounds) return

    // Zustand에 bounds 동기화 → React Query 등에서 사용
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    setMapBounds({
      minLat: sw.getLat(),
      maxLat: ne.getLat(),
      minLng: sw.getLng(),
      maxLng: ne.getLng(),
    })

    // 클라이언트 그리드 타일 생성 + 폴리곤 렌더링
    const tiles = buildViewportTiles(bounds)
    clearOverlays()

    const overlays = tiles.map((tile) => {
      const color = getUnivColor(tile.owner_univ)
      const path = tile.polygon.map(
        (p) => new window.kakao.maps.LatLng(p.lat, p.lng)
      )

      const polygon = new window.kakao.maps.Polygon({
        map,
        path,
        strokeWeight: 1,
        strokeColor: color.stroke,
        strokeOpacity: 0.6,
        fillColor: color.fill,
        fillOpacity: 1,
      })

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile)
      })

      return polygon
    })

    overlaysRef.current = overlays
    setTileCount(tiles.length)
  }, [clearOverlays, setMapBounds, setSelectedTile])

  // ─── 카카오맵 초기화 (SDK load 분기 포함) ──────────────────
  useEffect(() => {
    const initMap = () => {
      if (!mapContainerRef.current || mapRef.current || !window.kakao?.maps) {
        return
      }

      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 3,
      })

      mapRef.current = map
      markerRef.current = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(center.lat, center.lng),
      })

      idleHandlerRef.current = () => renderGrid()
      window.kakao.maps.event.addListener(map, 'idle', idleHandlerRef.current)

      renderGrid()
      setMapReady(true)
    }

    // autoload=false 인 경우 kakao.maps.load() 콜백을 사용
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(initMap)
      return
    }

    // autoload=true(기본)이면 바로 초기화
    if (window.kakao?.maps) {
      initMap()
    }
  }, [center.lat, center.lng, renderGrid])

  // ─── center 변경 시 지도 중심·마커 이동 ────────────────────
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return
    const position = new window.kakao.maps.LatLng(center.lat, center.lng)
    mapRef.current.setCenter(position)
    markerRef.current?.setPosition(position)
  }, [center])

  // ─── 컴포넌트 언마운트 시 리소스 정리 ─────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current && idleHandlerRef.current && window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(
          mapRef.current,
          'idle',
          idleHandlerRef.current
        )
      }
      markerRef.current?.setMap(null)
      clearOverlays()
    }
  }, [clearOverlays])

  const sdkMissing = !mapReady && !window.kakao?.maps

  return (
    <div className="absolute inset-0">
      {/* 카카오맵 컨테이너 */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* 우상단 타일 카운터 뱃지 */}
      {tileCount > 0 && (
        <div className="absolute right-4 top-20 z-20 bg-white/80 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm border border-white/60">
          30m grid: {tileCount.toLocaleString()} cells
        </div>
      )}

      {/* SDK 미로드 시 라이트 모드 플레이스홀더 */}
      {sdkMissing && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
          {/* 배경 그리드 패턴 */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          <MotionDiv
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, delay: 0.2 }}
            className="relative z-10 text-center px-8"
          >
            <MotionDiv
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg shadow-indigo-500/10 border border-white/60 flex items-center justify-center text-4xl"
            >
              🗺️
            </MotionDiv>

            <h2 className="text-xl font-extrabold text-slate-700 tracking-tight mb-2">
              지도 로딩 대기중
            </h2>
            <p className="text-sm text-slate-400 font-medium max-w-[260px] mx-auto leading-relaxed">
              카카오맵 JavaScript SDK를{' '}
              <code className="text-xs bg-white/80 text-indigo-500 px-1.5 py-0.5 rounded-md font-semibold">
                index.html
              </code>
              에 추가해주세요
            </p>

            {center && (
              <div className="mt-5 inline-flex flex-col gap-1 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 text-[11px] font-medium text-slate-400">
                <span>📍 {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</span>
              </div>
            )}
          </MotionDiv>
        </div>
      )}
    </div>
  )
}
