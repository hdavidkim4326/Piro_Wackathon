import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useSpecialCenters, useTiles } from '../hooks/useTiles'

const MotionDiv = motion.div

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MAX_VISIBLE_TILES = 1200
const ONLY_5X5_PIN_LEVEL = 8
const SEOUL_MIN_LAT = 37.4133
const SEOUL_MAX_LAT = 37.7151
const SEOUL_MIN_LNG = 126.7341
const SEOUL_MAX_LNG = 127.2693

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

const SPECIAL_PIN_THEME = {
  '3x3': {
    beanBackground: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
    beanBorder: '#92400e',
    lobeColor: 'rgba(254, 252, 232, 0.75)',
    textColor: '#7c2d12',
    tipColor: '#92400e',
    glowColor: 'rgba(245, 158, 11, 0.42)',
    label: '3x3',
  },
  '5x5': {
    beanBackground: 'linear-gradient(135deg, #fed7aa 0%, #b45309 55%, #7c2d12 100%)',
    beanBorder: '#7c2d12',
    lobeColor: 'rgba(255, 237, 213, 0.45)',
    textColor: '#fff7ed',
    tipColor: '#7c2d12',
    glowColor: 'rgba(124, 45, 18, 0.5)',
    label: '5x5',
  },
  default: {
    beanBackground: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
    beanBorder: '#92400e',
    lobeColor: 'rgba(254, 252, 232, 0.75)',
    textColor: '#7c2d12',
    tipColor: '#92400e',
    glowColor: 'rgba(245, 158, 11, 0.42)',
    label: '3x3',
  },
}

function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS._empty
  const trimmed = String(univ).trim()
  return UNIV_COLORS[trimmed] || UNIV_COLORS._unknown
}

function parseGridId(gridId) {
  if (!gridId) return null
  const parts = String(gridId).split('_')
  if (parts.length !== 3 || parts[0] !== 'grid') return null
  const row = Number(parts[1])
  const col = Number(parts[2])
  if (!Number.isFinite(row) || !Number.isFinite(col)) return null
  return { row, col }
}

function buildPolygonFromGridId(gridId) {
  const point = parseGridId(gridId)
  if (!point) return []

  const south = point.row * LAT_STEP
  const north = south + LAT_STEP
  const west = point.col * LNG_STEP
  const east = west + LNG_STEP

  return [
    { lat: south, lng: west },
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
  ]
}

function buildSpecialCenterTile(center) {
  return {
    grid_id: center.grid_id,
    owner_univ: null,
    level: 0,
    is_special: true,
    special_type: center.special_type || '3x3',
    in_special_zone: true,
    special_zone_type: center.special_type || '3x3',
    special_center_grid_id: center.grid_id,
    polygon: buildPolygonFromGridId(center.grid_id),
  }
}

function isFullSeoulVisible(bounds) {
  if (!bounds) return false
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()

  return (
    sw.getLat() <= SEOUL_MIN_LAT &&
    ne.getLat() >= SEOUL_MAX_LAT &&
    sw.getLng() <= SEOUL_MIN_LNG &&
    ne.getLng() >= SEOUL_MAX_LNG
  )
}

function createPeanutPinElement(specialType) {
  const theme = SPECIAL_PIN_THEME[specialType] || SPECIAL_PIN_THEME.default

  const wrapper = document.createElement('button')
  wrapper.type = 'button'
  wrapper.setAttribute('aria-label', `${theme.label} special center`)
  wrapper.style.cssText =
    'display:flex;flex-direction:column;align-items:center;cursor:pointer;' +
    'background:transparent;border:0;padding:0;outline:none;'

  const bean = document.createElement('div')
  bean.style.cssText =
    'position:relative;min-width:40px;height:26px;padding:0 10px;display:flex;' +
    'align-items:center;justify-content:center;border-radius:999px;font-size:11px;' +
    'font-weight:900;letter-spacing:0.2px;line-height:1;border:2px solid;' +
    `color:${theme.textColor};border-color:${theme.beanBorder};` +
    `background:${theme.beanBackground};box-shadow:0 6px 12px ${theme.glowColor};`

  const leftLobe = document.createElement('span')
  leftLobe.style.cssText =
    'position:absolute;left:6px;top:4px;width:12px;height:16px;border-radius:999px;' +
    `background:${theme.lobeColor};`

  const rightLobe = document.createElement('span')
  rightLobe.style.cssText =
    'position:absolute;right:6px;top:4px;width:12px;height:16px;border-radius:999px;' +
    `background:${theme.lobeColor};`

  const text = document.createElement('span')
  text.textContent = theme.label
  text.style.cssText = 'position:relative;z-index:1;'

  bean.append(leftLobe, rightLobe, text)

  const tip = document.createElement('div')
  tip.style.cssText =
    'width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;' +
    `border-top:9px solid ${theme.tipColor};margin-top:-1px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.28));`

  wrapper.append(bean, tip)
  return wrapper
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
  const polygonOverlaysRef = useRef([])
  const specialPinOverlaysRef = useRef([])
  const markerRef = useRef(null)
  const idleHandlerRef = useRef(null)
  const drawPolygonsRef = useRef(null)
  const drawSpecialPinsRef = useRef(null)
  const demoClickRef = useRef(null)

  const [mapReady, setMapReady] = useState(false)
  const [tileCount, setTileCount] = useState(0)
  const [specialCenterCount, setSpecialCenterCount] = useState(0)
  const [showOnly5x5Pins, setShowOnly5x5Pins] = useState(false)
  const [hideAllPins, setHideAllPins] = useState(false)

  const setMapBounds = useGameStore((state) => state.setMapBounds)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)
  const demoMode = useGameStore((s) => s.demoMode)
  const setLocation = useGameStore((s) => s.setLocation)
  const { data: serverTiles } = useTiles()
  const { data: specialCenters } = useSpecialCenters()

  const clearPolygonOverlays = useCallback(() => {
    polygonOverlaysRef.current.forEach((overlay) => overlay.setMap(null))
    polygonOverlaysRef.current = []
  }, [])

  const clearSpecialPinOverlays = useCallback(() => {
    specialPinOverlaysRef.current.forEach((overlay) => overlay.setMap(null))
    specialPinOverlaysRef.current = []
    setSpecialCenterCount(0)
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

    clearPolygonOverlays()

    const overlays = mergedTiles.map((tile) => {
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

      return polygon
    })

    polygonOverlaysRef.current = overlays
    setTileCount(mergedTiles.length)
  }, [clearPolygonOverlays, serverTiles, setSelectedTile])

  const drawSpecialCenterPins = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return
    clearSpecialPinOverlays()
    const bounds = mapRef.current.getBounds?.()
    const fullSeoulVisible = isFullSeoulVisible(bounds)
    setHideAllPins(fullSeoulVisible)
    if (fullSeoulVisible) {
      setShowOnly5x5Pins(false)
      return
    }

    const zoomLevel = mapRef.current.getLevel?.() ?? 3
    const only5x5 = zoomLevel >= ONLY_5X5_PIN_LEVEL
    setShowOnly5x5Pins(only5x5)
    if (!specialCenters || specialCenters.length === 0) return
    const visibleCenters = only5x5
      ? specialCenters.filter((center) => center?.special_type === '5x5')
      : specialCenters

    const tileMap = new Map()
    if (serverTiles && serverTiles.length > 0) {
      serverTiles.forEach((tile) => {
        tileMap.set(tile.grid_id, tile)
      })
    }

    const overlays = visibleCenters.flatMap((center) => {
      if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng)) return []
      if (!center?.grid_id) return []

      const content = createPeanutPinElement(center.special_type)
      const overlay = new window.kakao.maps.CustomOverlay({
        map: mapRef.current,
        position: new window.kakao.maps.LatLng(center.lat, center.lng),
        yAnchor: 1.08,
        clickable: true,
        content,
      })

      content.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()

        const serverTile = tileMap.get(center.grid_id)
        const selectedTile = serverTile
          ? {
              ...serverTile,
              is_special: true,
              special_type: center.special_type || serverTile.special_type || '3x3',
              in_special_zone: true,
              special_zone_type: center.special_type || serverTile.special_zone_type || '3x3',
              special_center_grid_id: center.grid_id,
              polygon:
                serverTile.polygon && serverTile.polygon.length > 0
                  ? serverTile.polygon
                  : buildPolygonFromGridId(center.grid_id),
            }
          : buildSpecialCenterTile(center)

        setSelectedTile(selectedTile)
      })

      return [overlay]
    })

    specialPinOverlaysRef.current = overlays
    setSpecialCenterCount(overlays.length)
  }, [clearSpecialPinOverlays, serverTiles, setSelectedTile, specialCenters])

  useEffect(() => {
    drawPolygonsRef.current = drawPolygons
  }, [drawPolygons])

  useEffect(() => {
    drawSpecialPinsRef.current = drawSpecialCenterPins
  }, [drawSpecialCenterPins])

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
    drawSpecialPinsRef.current?.()
  }, [setMapBounds])

  useEffect(() => {
    if (!mapReady) return
    drawPolygons()
  }, [drawPolygons, mapReady, serverTiles])

  useEffect(() => {
    if (!mapReady) return
    drawSpecialCenterPins()
  }, [drawSpecialCenterPins, mapReady, specialCenters, serverTiles])

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

  // 데모 모드: 지도 클릭 → 위치 텔레포트
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return

    if (demoClickRef.current) {
      window.kakao.maps.event.removeListener(mapRef.current, 'click', demoClickRef.current)
      demoClickRef.current = null
    }

    if (demoMode) {
      const handler = (mouseEvent) => {
        const lat = mouseEvent.latLng.getLat()
        const lng = mouseEvent.latLng.getLng()
        setLocation({ lat, lng })
        markerRef.current?.setPosition(new window.kakao.maps.LatLng(lat, lng))
      }
      demoClickRef.current = handler
      window.kakao.maps.event.addListener(mapRef.current, 'click', handler)
    }
  }, [demoMode, setLocation, mapReady])

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
      if (mapRef.current && window.kakao?.maps?.event) {
        if (idleHandlerRef.current) {
          window.kakao.maps.event.removeListener(mapRef.current, 'idle', idleHandlerRef.current)
        }
        if (demoClickRef.current) {
          window.kakao.maps.event.removeListener(mapRef.current, 'click', demoClickRef.current)
        }
      }
      markerRef.current?.setMap(null)
      clearPolygonOverlays()
      clearSpecialPinOverlays()
    }
  }, [clearPolygonOverlays, clearSpecialPinOverlays])

  const sdkMissing = !mapReady && !window.kakao?.maps

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" />

      {tileCount > 0 && (
        <div className="absolute right-4 top-20 z-20 rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur-md">
          30m grid: {tileCount.toLocaleString()} cells
          {specialCenterCount > 0 && (
            <div className="mt-0.5 text-[10px] font-bold text-amber-700">
              peanut pins: {specialCenterCount.toLocaleString()}
            </div>
          )}
          {showOnly5x5Pins && (
            <div className="mt-0.5 text-[10px] font-bold text-amber-900">
              zoomed out: 5x5 only
            </div>
          )}
          {hideAllPins && (
            <div className="mt-0.5 text-[10px] font-bold text-slate-500">
              full seoul view: pins hidden
            </div>
          )}
        </div>
      )}

      <div className="absolute left-4 top-20 z-20 rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-md">
        <span className="mr-2 inline-flex items-center gap-1 rounded-full border border-amber-700 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
          <span className="inline-block h-2.5 w-4 rounded-full border border-amber-700 bg-gradient-to-r from-amber-100 to-amber-400" />
          3x3
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-900 bg-orange-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
          <span className="inline-block h-2.5 w-4 rounded-full border border-amber-900 bg-gradient-to-r from-orange-200 to-amber-900" />
          5x5
        </span>
      </div>

      {demoMode && mapReady && (
        <div className="absolute bottom-32 left-1/2 z-30 -translate-x-1/2 animate-pulse rounded-full bg-rose-500/90 px-4 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          DEMO — 지도를 탭하여 이동
        </div>
      )}

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
