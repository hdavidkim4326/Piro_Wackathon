/**
 * GPS 위치 추적 훅
 * ────────────────
 * 브라우저의 Geolocation API를 사용해 사용자의 현재 위치를 추적한다.
 * 위치가 변경되면 Zustand 스토어에 자동으로 업데이트한다.
 */

import { useEffect, useState } from 'react'
import useGameStore from '../store/gameStore'

/**
 * GPS 위치를 실시간으로 추적하는 커스텀 훅.
 *
 * @returns {{ location: object|null, error: string|null, loading: boolean }}
 */
export function useGeolocation() {
  const setLocation = useGameStore((state) => state.setLocation)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 브라우저가 Geolocation을 지원하지 않는 경우
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 사용할 수 없습니다.')
      setLoading(false)
      return
    }

    // 위치 변경 시 콜백 — watchPosition으로 실시간 추적
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setLoading(false)
      },
      (err) => {
        setError(`위치 정보를 가져올 수 없습니다: ${err.message}`)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )

    // 컴포넌트 언마운트 시 위치 추적 해제
    return () => navigator.geolocation.clearWatch(watchId)
  }, [setLocation])

  const location = useGameStore((state) => state.location)
  return { location, error, loading }
}
