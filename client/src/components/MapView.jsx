import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useTiles } from '../hooks/useTiles'

const MotionDiv = motion.div

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MAX_VISIBLE_TILES = 1200

const UNIV_COLORS = {
  서울대학교: { fill: '#3b82f6', stroke: '#2563eb', opacity: 0.4 },
  연세대학교: { fill: '#38bdf8', stroke: '#0ea5e9', opacity: 0.4 },
  고려대학교: { fill: '#ef4444', stroke: '#dc2626', opacity: 0.4 },
  우리대학교: { fill: '#a855f7', stroke: '#7c3aed', opacity: 0.4 },
  _unknown: { fill: '#f97316', stroke: '#ea580c', opacity: 0.4 },
  _empty: { fill: '#cbd5e1', stroke: '#94a3b8', opacity: 0.04 },
}

const SPECIAL_CENTER_STYLES = {
  '3x3': { stroke: '#f59e0b', fill: '#f59e0b', strokeOpacity: 0.95, fillOpacity: 0.22, strokeWeight: 3 },
  '5x5': { stroke: '#ef4444', fill: '#ef4444', strokeOpacity: 0.95, fillOpacity: 0.24, strokeWeight: 3 },
  default: { stroke: '#f59e0b', fill: '#f59e0b', strokeOpacity: 0.95, fillOpacity: 0.22, strokeWeight: 3 },
}

const SPECIAL_ZONE_STYLES = {
  '3x3': { stroke: '#f59e0b', fill: '#f59e0b', strokeOpacity: 0.75, fillOpacity: 0.12, strokeWeight: 2 },
  '5x5': { stroke: '#ef4444', fill: '#ef4444', strokeOpacity: 0.75, fillOpacity: 0.14, strokeWeight: 2 },
  default: { stroke: '#f59e0b', fill: '#f59e0b', strokeOpacity: 0.75, fillOpacity: 0.12, strokeWeight: 2 },
}

function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS._empty
  const trimmed = String(univ).trim()
  return UNIV_COLORS[trimmed] || UNIV_COLORS._unknown
}

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
        is_special: false,
        special_type: null,
        in_special_zone: false,
        special_zone_type: null,
        special_center_grid_id: null,
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

export default function MapView({ center }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const markerRef = useRef(null)
  const idleHandlerRef = useRef(null)
  const drawPolygonsRef = useRef(null)

  const [mapReady, setMapReady] = useState(false)
  const [tileCount, setTileCount] = useState(0)

  const setMapBounds = useGameStore((state) => state.setMapBounds)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)
  const { data: serverTiles } = useTiles()

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
  }, [])

  const drawPolygons = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return

    const bounds = mapRef.current.getBounds()
    if (!bounds) return

    const baseGrid = buildViewportTiles(bounds)
    const serverMap = new Map()
    if (serverTiles && serverTiles.length > 0) {
      serverTiles.forEach((tile) => {
        serverMap.set(tile.grid_id, tile)
      })
    }

    const mergedTiles = baseGrid.map((baseTile) => {
      const realTile = serverMap.get(baseTile.grid_id)
      if (!realTile) return baseTile
      return {
        ...baseTile,
        owner_univ: realTile.owner_univ,
        level: realTile.level,
        is_special: Boolean(realTile.is_special),
        special_type: realTile.special_type || null,
        in_special_zone: Boolean(realTile.in_special_zone),
        special_zone_type: realTile.special_zone_type || null,
        special_center_grid_id: realTile.special_center_grid_id || null,
      }
    })

    clearOverlays()

    const overlays = mergedTiles.flatMap((tile) => {
      const ownerColor = getUnivColor(tile.owner_univ)
      const isSpecialCenter = Boolean(tile.is_special)
      const inSpecialZone = Boolean(tile.in_special_zone)
      const specialZoneType = tile.special_zone_type || tile.special_type || null
      const specialCenterStyle =
        SPECIAL_CENTER_STYLES[specialZoneType] || SPECIAL_CENTER_STYLES.default
      const specialZoneStyle =
        SPECIAL_ZONE_STYLES[specialZoneType] || SPECIAL_ZONE_STYLES.default

      const path = tile.polygon.map(
        (point) => new window.kakao.maps.LatLng(point.lat, point.lng)
      )

      const strokeWeight = isSpecialCenter
        ? specialCenterStyle.strokeWeight
        : inSpecialZone
          ? specialZoneStyle.strokeWeight
          : tile.owner_univ
            ? 2
            : 1

      const strokeColor = isSpecialCenter
        ? specialCenterStyle.stroke
        : inSpecialZone
          ? specialZoneStyle.stroke
          : ownerColor.stroke

      const strokeOpacity = isSpecialCenter
        ? specialCenterStyle.strokeOpacity
        : inSpecialZone
          ? specialZoneStyle.strokeOpacity
          : tile.owner_univ
            ? 0.9
            : 0.3

      const fillColor = isSpecialCenter
        ? specialCenterStyle.fill
        : inSpecialZone
          ? specialZoneStyle.fill
          : ownerColor.fill

      const fillOpacity = isSpecialCenter
        ? specialCenterStyle.fillOpacity
        : inSpecialZone
          ? specialZoneStyle.fillOpacity
          : ownerColor.opacity

      const polygon = new window.kakao.maps.Polygon({
        map: mapRef.current,
        path,
        strokeWeight,
        strokeColor,
        strokeOpacity,
        fillColor,
        fillOpacity,
      })

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile)
      })

      if (!isSpecialCenter) return [polygon]

      const centerLat = (tile.polygon[0].lat + tile.polygon[2].lat) / 2
      const centerLng = (tile.polygon[0].lng + tile.polygon[2].lng) / 2
      const badgeLabel = tile.special_type === '5x5' ? 'SPECIAL 5x5' : 'SPECIAL 3x3'

      const badge = new window.kakao.maps.CustomOverlay({
        map: mapRef.current,
        position: new window.kakao.maps.LatLng(centerLat, centerLng),
        yAnchor: 1.2,
        content:
          '<div style="padding:2px 6px;border-radius:10px;' +
          'font-size:10px;font-weight:700;' +
          'background:rgba(17,24,39,0.85);color:white;white-space:nowrap;">' +
          badgeLabel +
          '</div>',
      })

      return [polygon, badge]
    })

    overlaysRef.current = overlays
    setTileCount(mergedTiles.length)
  }, [clearOverlays, serverTiles, setSelectedTile])

  useEffect(() => {
    drawPolygonsRef.current = drawPolygons
  }, [drawPolygons])

  const handleIdle = useCallback(() => {
    if (!mapRef.current) return

    const bounds = mapRef.current.getBounds()
    if (!bounds) return

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    setMapBounds({
      minLat: sw.getLat(),
      maxLat: ne.getLat(),
      minLng: sw.getLng(),
      maxLng: ne.getLng(),
    })

    drawPolygonsRef.current?.()
  }, [setMapBounds])

  useEffect(() => {
    if (!mapReady) return
    drawPolygons()
  }, [drawPolygons, mapReady, serverTiles])

  useEffect(() => {
    const checkKakaoReady = window.setInterval(() => {
      if (!window.kakao?.maps) return
      window.clearInterval(checkKakaoReady)

      window.kakao.maps.load(() => {
        if (mapRef.current || !mapContainerRef.current) return

        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 3,
        })

        mapRef.current = map
        markerRef.current = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(center.lat, center.lng),
        })

        idleHandlerRef.current = handleIdle
        window.kakao.maps.event.addListener(map, 'idle', idleHandlerRef.current)

        handleIdle()
        setMapReady(true)
      })
    }, 100)

    return () => {
      window.clearInterval(checkKakaoReady)
    }
  }, [center.lat, center.lng, handleIdle])

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps || !center) return

    const currentCenter = mapRef.current.getCenter()
    const dLat = Math.abs(currentCenter.getLat() - center.lat)
    const dLng = Math.abs(currentCenter.getLng() - center.lng)
    if (dLat < 0.0001 && dLng < 0.0001) return

    const position = new window.kakao.maps.LatLng(center.lat, center.lng)
    mapRef.current.panTo(position)
    markerRef.current?.setPosition(position)
  }, [center])

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
      <div ref={mapContainerRef} className="h-full w-full" />

      {tileCount > 0 && (
        <div className="absolute right-4 top-20 z-20 rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur-md">
          30m grid: {tileCount.toLocaleString()} cells
        </div>
      )}

      <div className="absolute left-4 top-20 z-20 rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-md">
        <span className="mr-2 inline-flex rounded bg-amber-500 px-1.5 py-0.5 text-white">
          3x3
        </span>
        <span className="inline-flex rounded bg-red-500 px-1.5 py-0.5 text-white">
          5x5
        </span>
      </div>

      {sdkMissing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
          <MotionDiv
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, delay: 0.2 }}
            className="relative z-10 px-8 text-center"
          >
            <h2 className="mb-2 text-xl font-extrabold tracking-tight text-slate-700">
              지도 로딩 대기중
            </h2>
            <p className="max-w-[260px] text-sm font-medium leading-relaxed text-slate-400">
              카카오맵 연결 준비중입니다.
            </p>
          </MotionDiv>
        </div>
      )}
    </div>
  )
}
