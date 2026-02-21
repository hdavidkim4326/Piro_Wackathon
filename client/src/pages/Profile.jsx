import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { submitSignup, verifySchoolEmail } from '../lib/api'

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || error?.message || fallback
}

export default function Profile() {
  const navigate = useNavigate()
  const user = useGameStore((state) => state.user)
  const setUser = useGameStore((state) => state.setUser)

  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [university, setUniversity] = useState(user?.university || '')
  const [devCode, setDevCode] = useState('')

  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleEmailChange = (nextEmail) => {
    setEmail(nextEmail)
    setVerified(false)
    setUniversity('')
    setCode('')
    setDevCode('')
    setError('')
    setMessage('')
  }

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your school email first.')
      return
    }

    setSending(true)
    setError('')
    setMessage('')
    setDevCode('')

    try {
      const response = await verifySchoolEmail({
        action: 'send_email',
        email: email.trim(),
      })
      setUniversity(response.university || '')
      setMessage('Verification code was sent. Check your email inbox.')
      if (response.dev_code) {
        setDevCode(response.dev_code)
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to send verification code.'))
    } finally {
      setSending(false)
    }
  }

  const handleCheckCode = async () => {
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!code.trim()) {
      setError('Enter the 6-digit verification code.')
      return
    }

    setChecking(true)
    setError('')
    setMessage('')

    try {
      const response = await verifySchoolEmail({
        action: 'check_number',
        email: email.trim(),
        code: code.trim(),
      })
      setVerified(true)
      setUniversity(response.university || university)
      setMessage('Email verification completed.')
    } catch (requestError) {
      setVerified(false)
      setError(getErrorMessage(requestError, 'Verification failed.'))
    } finally {
      setChecking(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()

    if (!verified) {
      setError('Verify your school email before signup.')
      return
    }

    if (!nickname.trim()) {
      setError('Nickname is required.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await submitSignup({
        email: email.trim(),
        nickname: nickname.trim(),
        university,
      })

      setUser({
        id: response.user.id,
        nickname: response.user.nickname,
        university: response.user.university,
      })
      setMessage('Signup completed successfully.')
      navigate('/')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Signup failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <h1 className="mx-auto max-w-lg text-xl font-bold text-slate-800">
          School Email Signup
        </h1>
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-600">
              School Email
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                placeholder="name@univ.ac.kr"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-600">
              Verification Code
            </label>
            <div className="flex gap-2">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleCheckCode}
                disabled={checking}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Verify'}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="mb-2 block text-sm font-semibold text-slate-600"
            >
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={30}
              placeholder="2-30 characters"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            University: {university || '-'}
          </div>

          {verified && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Email verification is complete.
            </div>
          )}

          {devCode && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Dev mode code: {devCode}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !verified}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Signing up...' : 'Complete Signup'}
          </button>
        </form>

        {user && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            Logged-in profile: {user.nickname} ({user.university})
          </div>
        )}
      </div>
    </div>
  )
}
