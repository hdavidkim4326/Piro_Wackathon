import { useGeolocation } from '../hooks/useGeolocation'
import MapView from '../components/MapView'
import TileInfoPanel from '../components/TileInfoPanel'
import useGameStore from '../store/gameStore'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export default function Home() {
  const { location, error, loading } = useGeolocation()
  const user = useGameStore((state) => state.user)
  const center = location || DEFAULT_CENTER

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-100">
      <MapView center={center} />

      <header className="absolute left-4 right-4 top-5 z-30 rounded-2xl border border-white/60 bg-white/90 px-5 py-3.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight text-slate-800">
              {user?.nickname || 'Campus Turf War'}
            </p>
            <p className="truncate text-[11px] font-medium text-slate-400">
              {user?.university ||
                (loading
                  ? 'Reading GPS...'
                  : error
                    ? 'GPS unavailable'
                    : 'GPS connected')}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            30m grid
          </div>
        </div>
      </header>

      <TileInfoPanel />
    </div>
  )
}
