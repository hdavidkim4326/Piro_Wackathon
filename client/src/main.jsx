/**
 * 앱 진입점 (Entry Point)
 * ──────────────────────
 * React 앱을 DOM에 마운트하고, 전역 프로바이더를 설정한다.
 * - QueryClientProvider: React Query의 캐시 및 설정 제공
 * - StrictMode: 개발 환경에서 잠재적 문제를 감지
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.jsx'
import './index.css'

// ─── React Query 클라이언트 생성 ────────────────────────────
// 기본 설정: 실패 시 1회 재시도, 에러 시 자동 refetch 비활성화
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ─── React 앱 마운트 ─────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    navigator.serviceWorker.register(`${normalizedBase}sw.js`).catch((error) => {
      console.error('[PWA] service worker registration failed:', error)
    })
  })
}
