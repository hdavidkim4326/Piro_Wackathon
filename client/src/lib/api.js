/**
 * API 통신 모듈
 * ─────────────
 * 백엔드 서버와의 모든 HTTP 통신을 중앙에서 관리한다.
 */

import axios from 'axios'

function resolveApiBaseUrl(rawValue) {
  const trimmed = String(rawValue || '').trim()
  const fallback = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'

  if (!trimmed) return fallback

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/api')) return withoutTrailingSlash
  return `${withoutTrailingSlash}/api`
}

const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const api = axios.create({
  baseURL: apiBaseUrl,
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

export async function fetchSpecialCenters({ minLat, maxLat, minLng, maxLng }) {
  const res = await api.get('/special-centers', {
    params: { min_lat: minLat, max_lat: maxLat, min_lng: minLng, max_lng: maxLng },
  })
  return res.data
}

// ─── 2. 총괄님이 작성한 점령 API + 유저 ID 헤더 전송 (유지 및 보완) ───
export async function occupyTile({ gridId, university, level = 1, userId = null }) {
  // 로그인한 유저의 ID가 있으면 HTTP 헤더(X-User-Id)에 실어서 보냅니다.
  const headers = userId ? { 'X-User-Id': String(userId) } : {}

  const res = await api.post('/occupy', { grid_id: gridId, university, level }, { headers })
  return res.data // (잘렸던 return 구문 복구)
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

function getPersistedUser() {
  try {
    const raw = localStorage.getItem('campus-turf-war')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.user || null
  } catch {
    return null
  }
}

export function logoutUser() {
  // 이전 팀 코드 호환용 함수
  return true
}

export async function fetchMyTileCount() {
  const user = getPersistedUser()
  if (!user?.id) return { count: 0 }

  try {
    const stats = await fetchMyStats(user.id)
    return { count: Number(stats?.organization_tile_count || 0) }
  } catch {
    return { count: 0 }
  }
}

export async function updateMyProfile(payload = {}) {
  const user = getPersistedUser()
  if (!user?.id) {
    return { success: true, local_only: true }
  }

  try {
    const res = await api.patch('/users/me', payload, {
      headers: { 'X-User-Id': String(user.id) },
    })
    return res.data
  } catch (error) {
    // 서버 라우트가 아직 없더라도 화면 동작이 깨지지 않게 호환 처리
    if ([404, 405].includes(error?.response?.status)) {
      return { success: true, local_only: true }
    }
    throw error
  }
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
export async function claimTileGame(gridId, sessionId, options = {}) {
  const headers = options?.userId
    ? { 'X-User-Id': String(options.userId) }
    : undefined
  const response = await api.post(
    `/games/${gridId}/claim`,
    {
      session_id: sessionId,
    },
    { headers }
  )
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
