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

export default useGameStore
