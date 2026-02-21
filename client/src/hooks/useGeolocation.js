/**
 * GPS 위치 추적 훅
 * ─────────────────
 * demoMode가 켜져 있으면 실제 GPS를 사용하지 않는다.
 * 대신 store의 location을 지도 클릭(MapView)으로 직접 제어한다.
 */

import { useEffect, useState } from 'react'
import useGameStore from '../store/gameStore'

export function useGeolocation() {
  const setLocation = useGameStore((s) => s.setLocation)
  const location = useGameStore((s) => s.location)
  const demoMode = useGameStore((s) => s.demoMode)

  const geolocationAvailable =
    typeof navigator !== 'undefined' && Boolean(navigator.geolocation)

  const [error, setError] = useState(
    geolocationAvailable ? null : 'This browser does not support geolocation.'
  )
  const [loading, setLoading] = useState(!demoMode && geolocationAvailable)

  useEffect(() => {
    if (demoMode) {
      setLoading(false)
      setError(null)
      return
    }

    if (!geolocationAvailable) return

    setLoading(true)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setLoading(false)
      },
      (watchError) => {
        setError(`Unable to read location: ${watchError.message}`)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [demoMode, geolocationAvailable, setLocation])

  return { location, error, loading, demoMode }
}
