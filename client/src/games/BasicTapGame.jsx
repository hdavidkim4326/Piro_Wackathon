import { useEffect, useMemo, useRef, useState } from 'react'

const LIMIT_SECONDS = 10
const GOAL_SCORE = 50

export default function BasicTapGame({ busy, onSubmitResult }) {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(LIMIT_SECONDS)
  const [score, setScore] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef(null)
  const scoreRef = useRef(0)

  const buttonLabel = useMemo(() => {
    if (!running) return 'Start'
    return 'Tap!'
  }, [running])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [])

  const startGame = () => {
    if (running || busy) return

    setRunning(true)
    setSubmitted(false)
    setTimeLeft(LIMIT_SECONDS)
    setScore(0)
    scoreRef.current = 0

    let localTime = LIMIT_SECONDS
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }

    timerRef.current = window.setInterval(() => {
      localTime -= 1
      setTimeLeft(localTime)

      if (localTime <= 0) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
        setRunning(false)
        const finalScore = scoreRef.current
        const success = finalScore >= GOAL_SCORE
        setSubmitted(true)
        onSubmitResult?.({
          success,
          score: finalScore,
          gameLevel: 1,
        })
      }
    }, 1000)
  }

  const handleTap = () => {
    if (!running || busy) return
    setScore((prev) => {
      const next = prev + 1
      scoreRef.current = next
      return next
    })
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-600">
        Tap at least <b>{GOAL_SCORE}</b> times in {LIMIT_SECONDS} seconds.
      </p>

      <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
        Time: <b>{timeLeft}s</b> | Score: <b>{score}</b>
      </div>

      <div className="flex gap-2">
        <button
          onClick={startGame}
          disabled={running || busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {buttonLabel}
        </button>
        <button
          onClick={handleTap}
          disabled={!running || busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Tap
        </button>
      </div>

      {submitted && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Result submitted.
        </div>
      )}
    </div>
  )
}
