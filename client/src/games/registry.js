/**
 * 게임 컴포넌트 레지스트리
 * ─────────────────────────
 * game_type → React 컴포넌트 매핑.
 * iframe 대신 React 컴포넌트를 직접 사용하여
 * postMessage 의존성과 alert 블로킹 문제를 제거한다.
 */

import BasicTapGame from './BasicTapGame'
import BasicRpsGame from './BasicRpsGame'
import BasicTimingGame from './BasicTimingGame'
import BossClickGame from './BossClickGame'

export const GAME_REGISTRY = {
  basic_tap: {
    title: '광클 챌린지',
    mode: 'component',
    component: BasicTapGame,
  },
  basic_rps: {
    title: '가위바위보',
    mode: 'component',
    component: BasicRpsGame,
  },
  basic_timing: {
    title: '타이밍 맞추기',
    mode: 'component',
    component: BasicTimingGame,
  },
  boss_click: {
    title: '보스 클릭 배틀',
    mode: 'component',
    component: BossClickGame,
  },
}

export function getGameComponentEntry(gameType) {
  return GAME_REGISTRY[gameType] || null
}
