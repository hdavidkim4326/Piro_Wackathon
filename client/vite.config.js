import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite 빌드 설정
 * - React 플러그인: JSX 변환 및 HMR 지원
 * - Tailwind CSS v4 Vite 플러그인
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
