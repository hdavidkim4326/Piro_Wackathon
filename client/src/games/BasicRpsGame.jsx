import { useMemo, useState } from 'react'

const CHOICES = ['rock', 'paper', 'scissors']
const LABELS = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

function randomChoice() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)]
}

function judge(myChoice, cpuChoice) {
  if (myChoice === cpuChoice) return 'draw'
  if (
    (myChoice === 'rock' && cpuChoice === 'scissors') ||
    (myChoice === 'paper' && cpuChoice === 'rock') ||
    (myChoice === 'scissors' && cpuChoice === 'paper')
  ) {
    return 'win'
  }
  return 'lose'
}

export default function BasicRpsGame({ busy, onSubmitResult }) {
  const [round, setRound] = useState(1)
  const [myScore, setMyScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [myChoice, setMyChoice] = useState('-')
  const [cpuChoice, setCpuChoice] = useState('-')
  const [done, setDone] = useState(false)
  const [message, setMessage] = useState('Choose your move.')

  const canPlay = useMemo(() => !done && !busy, [done, busy])

  const play = (choice) => {
    if (!canPlay) return

    const cpu = randomChoice()
    const outcome = judge(choice, cpu)

    setMyChoice(LABELS[choice])
    setCpuChoice(LABELS[cpu])

    let nextMy = myScore
    let nextCpu = cpuScore

    if (outcome === 'win') {
      nextMy += 1
      setMessage('Round win')
    } else if (outcome === 'lose') {
      nextCpu += 1
      setMessage('Round lose')
    } else {
      setMessage('Draw')
    }

    setMyScore(nextMy)
    setCpuScore(nextCpu)

    const finished = nextMy >= 2 || nextCpu >= 2 || round >= 3
    if (finished) {
      const success = nextMy > nextCpu
      setDone(true)
      setMessage(success ? 'You win the match.' : 'You lost the match.')
      onSubmitResult?.({
        success,
        score: nextMy,
        gameLevel: 1,
      })
      return
    }

    setRound((prev) => prev + 1)
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-600">Best of 3 rounds. Win to capture tile.</p>
      <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
        Round {round}/3 | You {myScore}:{cpuScore} CPU
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-slate-200 p-2">You: {myChoice}</div>
        <div className="rounded-lg border border-slate-200 p-2">CPU: {cpuChoice}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => play('rock')}
          disabled={!canPlay}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Rock
        </button>
        <button
          onClick={() => play('paper')}
          disabled={!canPlay}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Paper
        </button>
        <button
          onClick={() => play('scissors')}
          disabled={!canPlay}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Scissors
        </button>
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  )
}
