/**
 * 서버 데이터 훅 모음 (React Query)
 * ─────────────────────────────────
 * 타일·랭킹 등 서버에서 가져오는 데이터를 React Query로 관리한다.
 * Zustand 스토어의 mapBounds가 바뀔 때마다 타일을 자동 재요청한다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTiles, occupyTile, fetchRanking } from '../lib/api'
import useGameStore from '../store/gameStore'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  타일 관련 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 현재 지도 뷰포트 내의 타일 목록을 조회하는 훅.
 * mapBounds가 변경될 때마다 자동으로 refetch된다.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
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

    // mapBounds가 없으면(지도 미로드) 쿼리 실행하지 않음
    enabled: !!mapBounds,

    // 10초간 캐시 유지
    staleTime: 10 * 1000,
    // 🔥 [추가 1] 5초마다 백그라운드에서 최신 타일(땅 주인) 정보를 가져옴 (실시간 동기화)
    refetchInterval: 5000, 
    
    // 🔥 [추가 2] 유저가 카톡을 보다가 다시 게임 화면(브라우저)으로 돌아왔을 때 즉시 갱신
    refetchOnWindowFocus: true,
  })
}

/**
 * 타일 점령 뮤테이션 훅.
 * 점령 성공 시 타일 목록과 랭킹 캐시를 모두 무효화한다.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOccupyTile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: occupyTile,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiles'] })
      queryClient.invalidateQueries({ queryKey: ['ranking'] })
    },
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  랭킹 관련 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 대학교별 점령 랭킹을 조회하는 훅.
 * 30초마다 자동으로 갱신된다.
 *
 * @param {number} [limit=10] - 가져올 최대 순위 수
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useRanking(limit = 10) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn: () => fetchRanking(limit),
    staleTime: 30 * 1000,
  })
}
