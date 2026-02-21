const REALTIME_BADGE = {
  idle: { label: 'offline', className: 'bg-slate-600/40 text-slate-200' },
  connecting: { label: 'syncing', className: 'bg-amber-500/30 text-amber-100' },
  live: { label: 'live', className: 'bg-emerald-500/30 text-emerald-100' },
  error: { label: 'error', className: 'bg-rose-500/30 text-rose-100' },
  closed: { label: 'closed', className: 'bg-slate-600/40 text-slate-200' },
}

export default function BossClickGame({
  busy,
  bossState,
  remainingClicks,
  sessionStatus,
  realtimeStatus,
  onBossHit,
}) {
  const hp = Number(bossState?.current_hp ?? 0)
  const maxHp = Math.max(1, Number(bossState?.max_hp ?? 1))
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const defeated = hp <= 0

  const rt = REALTIME_BADGE[realtimeStatus] || REALTIME_BADGE.idle
  const canAttackRealtime = realtimeStatus === 'live'

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl border border-rose-400/20 bg-gradient-to-b from-rose-950/40 to-slate-950 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-100">
            Boss Raid
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rt.className}`}>
            realtime {rt.label}
          </span>
        </div>

        <div className="mb-1 flex items-center justify-between text-sm font-semibold text-rose-50">
          <span>Boss HP</span>
          <span>
            {hp} / {maxHp}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-rose-950/70">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-150"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
          Clicks: <b>{remainingClicks ?? '-'}</b>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
          Session: <b>{sessionStatus}</b>
        </div>
      </div>

      <button
        onClick={onBossHit}
        disabled={busy || defeated || !canAttackRealtime || (remainingClicks ?? 1) <= 0}
        className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {defeated
          ? 'Boss Defeated'
          : !canAttackRealtime
            ? 'Waiting Realtime'
            : busy
              ? 'Attacking...'
              : 'Attack Boss'}
      </button>
    </div>
  )
}
