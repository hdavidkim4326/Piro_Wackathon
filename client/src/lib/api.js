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

export async function occupyTile({ gridId, university, level = 1 }) {
  const res = await api.post('/occupy', { grid_id: gridId, university, level })
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

export default api
