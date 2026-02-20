/**
 * API 통신 모듈
 * ─────────────
 * 백엔드 서버와의 모든 HTTP 통신을 중앙에서 관리한다.
 * Axios 인스턴스를 생성해 base URL과 공통 헤더를 설정한다.
 */

import axios from 'axios'

// ─── Axios 인스턴스 생성 ────────────────────────────────────
// 모든 API 요청은 이 인스턴스를 통해 보낸다.
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 뷰포트 내 타일 목록을 서버에서 가져온다.
 *
 * @param {object} bounds - 지도 뷰포트 경계 좌표
 * @param {number} bounds.minLat - 남쪽 경계 위도
 * @param {number} bounds.maxLat - 북쪽 경계 위도
 * @param {number} bounds.minLng - 서쪽 경계 경도
 * @param {number} bounds.maxLng - 동쪽 경계 경도
 * @returns {Promise<Array>} 타일 정보 배열
 */
export async function fetchTiles({ minLat, maxLat, minLng, maxLng }) {
  const response = await api.get('/tiles', {
    params: {
      min_lat: minLat,
      max_lat: maxLat,
      min_lng: minLng,
      max_lng: maxLng,
    },
  })
  return response.data
}

/**
 * 특정 타일을 점령한다.
 *
 * @param {object} payload - 점령 요청 데이터
 * @param {string} payload.gridId - 점령할 그리드 ID
 * @param {string} payload.university - 점령하는 대학교 이름
 * @returns {Promise<object>} 점령 결과 응답
 */
export async function occupyTile({ gridId, university }) {
  const response = await api.post('/occupy', {
    grid_id: gridId,
    university,
  })
  return response.data
}

export default api
