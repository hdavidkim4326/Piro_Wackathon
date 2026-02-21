import BossClickGame from './BossClickGame'

const BASIC_IFRAME_SRC = '/games/game1/index.html'

export const GAME_REGISTRY = {
  basic_tap: {
    title: 'Stage 1 - Rapid Tap',
    mode: 'iframe',
    iframeSrc: BASIC_IFRAME_SRC,
  },
  basic_rps: {
    title: 'Stage 1 - Rock Paper Scissors',
    mode: 'iframe',
    iframeSrc: BASIC_IFRAME_SRC,
  },
  basic_timing: {
    title: 'Stage 1 - Timing Hit',
    mode: 'iframe',
    iframeSrc: BASIC_IFRAME_SRC,
  },
  boss_click: {
    title: 'Boss Click Battle',
    mode: 'component',
    component: BossClickGame,
  },
}

export function getGameComponentEntry(gameType) {
  return GAME_REGISTRY[gameType] || null
}
