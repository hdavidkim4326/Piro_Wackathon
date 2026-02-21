import { useEffect, useState } from 'react'
import useGameStore from '../store/gameStore'

const GEO_UNSUPPORTED_MESSAGE = 'This browser does not support geolocation.'

export function useGeolocation() {
  const setLocation = useGameStore((state) => state.setLocation)
  const location = useGameStore((state) => state.location)

  const geolocationAvailable =
    typeof navigator !== 'undefined' && Boolean(navigator.geolocation)

  const [error, setError] = useState(
    geolocationAvailable ? null : GEO_UNSUPPORTED_MESSAGE
  )
  const [loading, setLoading] = useState(geolocationAvailable)

  useEffect(() => {
    if (!geolocationAvailable) return

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
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [geolocationAvailable, setLocation])

  return { location, error, loading }
}
