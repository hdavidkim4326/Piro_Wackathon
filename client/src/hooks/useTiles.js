/**
 * 서버 데이터 훅 모음 (React Query)
 * ─────────────────────────────────
 * 타일·랭킹 등 서버에서 가져오는 데이터를 React Query로 관리한다.
 *
 * [점령 후 즉시 동기화 전략]
 *   invalidateQueries → staleTime 무시하고 즉시 refetch
 *   + refetchType: 'active' → 현재 마운트된 쿼리만 refetch
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMyStats, fetchTiles, occupyTile, fetchRanking } from '../lib/api'
import useGameStore from '../store/gameStore'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  타일 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useTiles() {
  const mapBounds = useGameStore((state) => state.mapBounds)

  return useQuery({
    queryKey: ['tiles', mapBounds],
    queryFn: () =>
      fetchTiles({
        minLat: mapBounds.minLat,
        maxLat: mapBounds.maxLat,
        minLng: mapBounds.minLng,
        maxLng: mapBounds.maxLng,
      }),
    enabled: !!mapBounds,
    staleTime: 5_000,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  점령 뮤테이션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useOccupyTile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: occupyTile,

    onSuccess: (data) => {
      // staleTime을 무시하고 현재 마운트된 tiles/ranking 쿼리를 즉시 refetch
      queryClient.invalidateQueries({
        queryKey: ['tiles'],
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: ['ranking'],
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: ['user', 'stats'],
        refetchType: 'active',
      })

      console.log('[useOccupyTile] 점령 성공, 타일 갱신 트리거:', data)
    },
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  랭킹 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useRanking(limit = 10) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn: () => fetchRanking(limit),
    staleTime: 30_000,
  })
}

export function useMyStats(userId) {
  return useQuery({
    queryKey: ['user', 'stats', userId],
    queryFn: () => fetchMyStats(userId),
    enabled: Boolean(userId),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })
}
