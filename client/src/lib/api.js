/**
 * API 통신 모듈
 * ─────────────
 * 백엔드 서버와의 모든 HTTP 통신을 중앙에서 관리한다.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ━━━ 타일 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchTiles({ minLat, maxLat, minLng, maxLng }) {
  const res = await api.get('/tiles', {
    params: { min_lat: minLat, max_lat: maxLat, min_lng: minLng, max_lng: maxLng },
  })
  return res.data
}

<<<<<<< HEAD
export async function occupyTile({ gridId, university, level = 1, userId = null }) {
  const headers = userId ? { 'X-User-Id': String(userId) } : {}
  const res = await api.post('/occupy', { grid_id: gridId, university, level }, { headers })
=======
export async function fetchSpecialCenters({ minLat, maxLat, minLng, maxLng }) {
  const res = await api.get('/special-centers', {
    params: { min_lat: minLat, max_lat: maxLat, min_lng: minLng, max_lng: maxLng },
  })
  return res.data
}

export async function occupyTile({ gridId, university, level = 1 }) {
  const res = await api.post('/occupy', { grid_id: gridId, university, level })
>>>>>>> cf39f88a3dff96aa5e5e8d9d5279cd53831cb650
  return res.data
}

// ━━━ 랭킹 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchRanking(limit = 10) {
  const res = await api.get('/ranking', { params: { limit } })
  return res.data
}

// ━━━ 인증 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function sendAuthCode(email) {
  const res = await api.post('/send-code', { email })
  return res.data
}

export async function verifyAuthCode(email, code) {
  const res = await api.post('/verify-code', { email, code })
  return res.data
}

export async function signUpUser({ email, nickname, password }) {
  const res = await api.post('/signup', { email, nickname, password })
  return res.data
}

export async function loginUser({ email, password }) {
  const res = await api.post('/login', { email, password })
  return res.data
}

export async function fetchMyStats(userId) {
  const res = await api.get('/users/me/stats', {
    headers: { 'X-User-Id': String(userId) },
  })
  return res.data
}

/**
 * Fetch game configuration assigned to a tile.
 *
 * @param {string} gridId
 */
export async function fetchTileGameConfig(gridId) {
  const response = await api.get(`/games/${gridId}`)
  return response.data
}

/**
 * Start a game session for a tile.
 *
 * @param {string} gridId
 * @param {{userKey?: string}} payload
 */
export async function startTileGameSession(gridId, payload = {}) {
  const response = await api.post(`/games/${gridId}/start`, {
    user_key: payload.userKey,
  })
  return response.data
}

/**
 * Submit game action (basic result or boss hit).
 *
 * @param {string} gridId
 * @param {object} payload
 */
export async function submitTileGameAction(gridId, payload) {
  const response = await api.post(`/games/${gridId}/action`, payload)
  return response.data
}

/**
 * Claim permission after successful game session.
 *
 * @param {string} gridId
 * @param {string} sessionId
 */
export async function claimTileGame(gridId, sessionId) {
  const response = await api.post(`/games/${gridId}/claim`, {
    session_id: sessionId,
  })
  return response.data
}

/**
 * Create websocket connection for boss game realtime updates.
 *
 * @param {string} gridId
 */
export function createBossGameSocket(gridId) {
  const apiUrl = new URL(api.defaults.baseURL, window.location.origin)
  const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsBase = `${wsProtocol}//${apiUrl.host}`
  return new WebSocket(`${wsBase}/api/games/${gridId}/ws`)
}

export default api
