import { useGeolocation } from '../hooks/useGeolocation'
import MapView from '../components/MapView'
import TileInfoPanel from '../components/TileInfoPanel'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export default function Home() {
  const { location, error, loading } = useGeolocation()
  const center = location || DEFAULT_CENTER

  return (
    <div className="h-full flex flex-col">
      <header className="z-30 flex-shrink-0 border-b border-surface-light bg-surface/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-primary">Campus Turf War</h1>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {loading && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                GPS loading...
              </span>
            )}
            {error && <span className="text-xs text-danger">{error}</span>}
            {!loading && !error && location && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                GPS connected
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative flex-1 pb-16">
        <MapView center={center} />
        <TileInfoPanel />
      </main>
    </div>
  )
}
