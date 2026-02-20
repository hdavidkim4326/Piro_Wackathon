/**
 * 타일 데이터 훅 (React Query)
 * ────────────────────────────
 * 서버에서 타일 목록을 가져오고 캐싱을 관리한다.
 * Zustand의 mapBounds가 바뀔 때마다 자동으로 재요청된다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTiles, occupyTile } from '../lib/api'
import useGameStore from '../store/gameStore'

/**
 * 현재 지도 뷰포트 내의 타일 목록을 조회하는 훅.
 *
 * mapBounds가 null이면(아직 지도가 로드되지 않았으면) 쿼리를 비활성화한다.
 * mapBounds가 변경될 때마다 쿼리 키가 바뀌므로 자동으로 refetch된다.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query 결과 객체
 */
export function useTiles() {
  const mapBounds = useGameStore((state) => state.mapBounds)

  return useQuery({
    // mapBounds 값 자체를 쿼리 키에 포함시켜 뷰포트가 바뀌면 새로 요청
    queryKey: ['tiles', mapBounds],

    queryFn: () =>
      fetchTiles({
        minLat: mapBounds.minLat,
        maxLat: mapBounds.maxLat,
        minLng: mapBounds.minLng,
        maxLng: mapBounds.maxLng,
      }),

    // mapBounds가 없으면 쿼리 실행하지 않음
    enabled: !!mapBounds,

    // 10초 동안 캐시 유지 (너무 자주 서버에 요청하지 않도록)
    staleTime: 10 * 1000,
  })
}

/**
 * 타일 점령 요청을 보내는 뮤테이션 훅.
 *
 * 점령 성공 시 타일 목록 캐시를 무효화해서 최신 데이터를 다시 가져온다.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult} 뮤테이션 결과 객체
 */
export function useOccupyTile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: occupyTile,

    // 점령 성공 후 타일 목록 캐시를 무효화하여 UI를 갱신
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiles'] })
    },
  })
}
