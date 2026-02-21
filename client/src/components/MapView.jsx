import { useCallback, useEffect, useRef, useState } from 'react'
import useGameStore from '../store/gameStore'

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034
const MAX_VISIBLE_TILES = 1200

const UNIV_COLORS = {
  default: { fill: 'rgba(107, 114, 128, 0.08)', stroke: '#6b7280' },
}

function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS.default
  return UNIV_COLORS[univ] || UNIV_COLORS.default
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
        polygon: [
          { lat: south, lng: west },
          { lat: north, lng: west },
          { lat: north, lng: east },
          { lat: south, lng: east },
        ],
      })

      if (tiles.length >= MAX_VISIBLE_TILES) {
        return tiles
      }
    }
  }

  return tiles
}

export default function MapView({ center }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const idleHandlerRef = useRef(null)
  const markerRef = useRef(null)

  const [mapReady, setMapReady] = useState(Boolean(window.kakao?.maps))
  const [tileCount, setTileCount] = useState(0)

  const setMapBounds = useGameStore((state) => state.setMapBounds)
  const setSelectedTile = useGameStore((state) => state.setSelectedTile)

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((polygon) => polygon.setMap(null))
    overlaysRef.current = []
  }, [])

  const renderGrid = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return

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

    const tiles = buildViewportTiles(bounds)
    clearOverlays()

    const overlays = tiles.map((tile) => {
      const color = getUnivColor(tile.owner_univ)
      const path = tile.polygon.map(
        (point) => new window.kakao.maps.LatLng(point.lat, point.lng)
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

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(initMap)
      return
    }

    if (window.kakao?.maps) {
      initMap()
    }
  }, [center.lat, center.lng, renderGrid])

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return

    const position = new window.kakao.maps.LatLng(center.lat, center.lng)
    mapRef.current.setCenter(position)
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
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="absolute right-4 top-4 z-20 rounded-md bg-surface/85 px-3 py-2 text-xs text-text-secondary backdrop-blur-sm">
        30m grid: {tileCount.toLocaleString()} cells
      </div>

      {sdkMissing && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-light/90 p-6 text-center">
          <div>
            <h2 className="mb-2 text-lg font-bold text-text-primary">
              Kakao map SDK is not loaded
            </h2>
            <p className="text-sm text-text-secondary">
              Add SDK script to <code>client/index.html</code> and set
              <code> VITE_KAKAO_MAP_APP_KEY</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
