import { useRef, useState } from 'react'

const TARGET_WIDTH = 20

function randomStart() {
  return Math.floor(Math.random() * 61)
}

export default function BasicTimingGame({ busy, onSubmitResult }) {
  const [running, setRunning] = useState(false)
  const [targetStart, setTargetStart] = useState(40)
  const [cursor, setCursor] = useState(0)
  const [message, setMessage] = useState('Press start.')

  const timerRef = useRef(null)
  const directionRef = useRef(1)
  const cursorRef = useRef(0)

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = () => {
    if (running || busy) return

    const nextTargetStart = randomStart()
    setTargetStart(nextTargetStart)
    setCursor(0)
    cursorRef.current = 0
    directionRef.current = 1
    setRunning(true)
    setMessage('Hit inside green zone.')

    stopTimer()
    timerRef.current = window.setInterval(() => {
      let next = cursorRef.current + directionRef.current * 1.8
      if (next >= 100) {
        next = 100
        directionRef.current = -1
      } else if (next <= 0) {
        next = 0
        directionRef.current = 1
      }
      cursorRef.current = next
      setCursor(next)
    }, 20)
  }

  const hit = () => {
    if (!running || busy) return

    stopTimer()
    setRunning(false)

    const success = cursor >= targetStart && cursor <= targetStart + TARGET_WIDTH
    const center = targetStart + TARGET_WIDTH / 2
    const score = Math.max(0, Math.round(100 - Math.abs(cursor - center)))

    setMessage(success ? 'Success!' : 'Failed!')
    onSubmitResult?.({
      success,
      score,
      gameLevel: 1,
    })
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-600">Stop the cursor inside the green zone.</p>
      <div className="relative h-6 overflow-hidden rounded-full bg-slate-200">
        <div
          className="absolute bottom-0 top-0 bg-emerald-400/70"
          style={{ left: `${targetStart}%`, width: `${TARGET_WIDTH}%` }}
        />
        <div
          className="absolute bottom-0 top-0 w-1 bg-rose-500"
          style={{ left: `${cursor}%` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={running || busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={hit}
          disabled={!running || busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Hit
        </button>
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  )
}
