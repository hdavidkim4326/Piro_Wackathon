/**
 * 게임 전역 상태 관리 (Zustand + persist)
 * ─────────────────────────────────────────
 * user, demoMode를 localStorage에 영속한다.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useGameStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      // 팀원 페이지(MyPage/ProfileEdit) 호환용 상태
      occupiedTiles: {},
      setOccupiedTiles: (occupiedTiles) => set({ occupiedTiles }),

      location: null,
      setLocation: (location) => set({ location }),

      mapBounds: null,
      setMapBounds: (mapBounds) => set({ mapBounds }),

      selectedTile: null,
      setSelectedTile: (selectedTile) => set({ selectedTile }),

      demoMode: false,
      setDemoMode: (demoMode) => set({ demoMode }),
    }),
    {
      name: 'campus-turf-war',
      partialize: (state) => ({ user: state.user, demoMode: state.demoMode }),
    }
  )
)

// 팀원 코드 호환을 위한 어댑터 훅
export function useGame() {
  const user = useGameStore((s) => s.user)
  const setUser = useGameStore((s) => s.setUser)
  const logout = useGameStore((s) => s.logout)
  const occupiedTiles = useGameStore((s) => s.occupiedTiles)

  const dispatch = (action) => {
    if (!action || typeof action !== 'object') return
    const { type, payload } = action
    switch (type) {
      case 'SET_USER':
        setUser(payload || null)
        break
      case 'LOGOUT':
      case 'DELETE_ACCOUNT':
        logout()
        break
      default:
        break
    }
  }

  return {
    state: { user, occupiedTiles },
    dispatch,
  }
}

export default useGameStore
