import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import MapView from '../components/MapView'
import TileInfoPanel from '../components/TileInfoPanel'
import { useGeolocation } from '../hooks/useGeolocation'
import useGameStore from '../store/gameStore'
import MapSearchBar from '../components/MapSearchBar'
import Top3RankingWidget from '../components/Top3Rankingwidget'

const MotionDiv = motion.div
const MotionButton = motion.button

const LAT_STEP = 0.00027
const LNG_STEP = 0.00034

function calcGridIdFromLatLng(lat, lng) {
  const row = Math.floor(lat / LAT_STEP)
  const col = Math.floor(lng / LNG_STEP)
  return `grid_${row}_${col}`
}

export default function Home() {
  const user = useGameStore((s) => s.user)
  const location = useGameStore((s) => s.location)
  const setLocation = useGameStore((s) => s.setLocation)
  const { loading, error, demoMode } = useGeolocation()

  const [mapCenter, setMapCenter] = useState(null)

  const center = mapCenter || location || { lat: 37.5665, lng: 126.978 }

  const currentGridId = useMemo(() => {
    if (!location) return null
    return calcGridIdFromLatLng(location.lat, location.lng)
  }, [location])

  const handleGpsClick = () => {
    if (location) {
      setMapCenter(location)
      setLocation({ ...location })
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      <MapView center={center} />

      <div className="absolute left-4 right-4 top-20 z-30 flex flex-col gap-3">
        <MapSearchBar
          onPickPlace={(p) => {
            setMapCenter({ lat: p.lat, lng: p.lng })
          }}
        />
      </div>

      <Top3RankingWidget />

      {/* GPS 내 위치 버튼 */}
      <MotionButton
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.25 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleGpsClick}
        className="absolute bottom-28 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-lg backdrop-blur-xl transition-colors active:bg-slate-50"
        aria-label="내 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-indigo-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </MotionButton>

      {/* 타일 클릭 시 바텀 시트 (점령 플로우 진입) */}
      <TileInfoPanel />
    </div>
  )
}
