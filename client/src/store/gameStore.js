/**
 * 게임 전역 상태 관리 (Zustand)
 * ─────────────────────────────
 * 사용자 정보, 현재 위치, UI 상태 등
 * 서버 데이터가 아닌 클라이언트 전용 상태를 관리한다.
 *
 * 서버 데이터(타일 목록 등)는 React Query가 관리하므로
 * 이 스토어에는 포함하지 않는다.
 */

import { create } from 'zustand'

/**
 * @typedef {object} GameState
 * @property {object|null} user - 로그인한 사용자 정보
 * @property {object|null} location - 현재 GPS 위치 { lat, lng }
 * @property {object|null} mapBounds - 현재 지도 뷰포트 경계
 */

const useGameStore = create((set) => ({
  // ─── 사용자 정보 ──────────────────────────────────────────
  user: null,

  /**
   * 사용자 정보를 설정한다.
   * @param {object} user - { nickname, university }
   */
  setUser: (user) => set({ user }),

  // ─── 현재 GPS 위치 ────────────────────────────────────────
  location: null,

  /**
   * GPS로 받아온 현재 위치를 저장한다.
   * @param {object} location - { lat: number, lng: number }
   */
  setLocation: (location) => set({ location }),

  // ─── 지도 뷰포트 경계 ─────────────────────────────────────
  mapBounds: null,

  /**
   * 지도를 움직일 때마다 뷰포트 경계를 업데이트한다.
   * React Query가 이 값을 참조해 타일 데이터를 다시 가져온다.
   * @param {object} bounds - { minLat, maxLat, minLng, maxLng }
   */
  setMapBounds: (mapBounds) => set({ mapBounds }),

  // ─── 선택된 타일 ──────────────────────────────────────────
  selectedTile: null,

  /**
   * 사용자가 탭한 타일을 선택 상태로 설정한다.
   * @param {object|null} tile - 선택된 타일 정보 또는 null (선택 해제)
   */
  setSelectedTile: (selectedTile) => set({ selectedTile }),
}))

export default useGameStore
