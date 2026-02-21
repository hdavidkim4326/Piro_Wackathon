export default function BossClickGame({
  busy,
  bossState,
  remainingClicks,
  sessionStatus,
  onBossHit,
}) {
  const hp = bossState?.current_hp ?? 0
  const maxHp = bossState?.max_hp ?? 1
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const defeated = hp <= 0

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-600">
        Team up to reduce boss HP. Each user has limited clicks.
      </p>

      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
        <div className="mb-2 flex items-center justify-between text-sm text-rose-800">
          <span>Boss HP</span>
          <span>
            {hp} / {maxHp}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-rose-200">
          <div
            className="h-full bg-rose-600 transition-all duration-150"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
        Remaining clicks: <b>{remainingClicks ?? '-'}</b>
      </div>

      <button
        onClick={onBossHit}
        disabled={busy || defeated || (remainingClicks ?? 1) <= 0}
        className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {defeated ? 'Boss Defeated' : busy ? 'Hitting...' : 'Attack Boss'}
      </button>

      <p className="text-xs text-slate-500">Session: {sessionStatus}</p>
    </div>
  )
}
