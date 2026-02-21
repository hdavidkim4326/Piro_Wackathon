/**
 * 게임 전역 상태 관리 (Zustand + persist)
 * ─────────────────────────────────────────
 * user를 localStorage에 영속하여 자동 로그인을 유지한다.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useGameStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      location: null,
      setLocation: (location) => set({ location }),

      mapBounds: null,
      setMapBounds: (mapBounds) => set({ mapBounds }),

      selectedTile: null,
      setSelectedTile: (selectedTile) => set({ selectedTile }),
    }),
    {
      name: 'campus-turf-war',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useGameStore
