'use client'

import { useState } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const FORGOT_PASSWORD_URL = 'http://localhost:3002/auth/forgot-password'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        let message = 'Failed to send reset link. Please try again.'
        try {
          const data = await res.json()
          if (data && typeof data.message === 'string') {
            message = data.message
          }
        } catch {
          // ignore JSON parsing errors; fall back to default message
        }
        throw new Error(message)
      }

      setError(null)
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to send password reset email', err)
      const message =
        err instanceof Error ? err.message : 'Failed to send reset link. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-black dark:text-white">define!.</h1>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-8 shadow-sm">
          {!submitted ? (
            <>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Reset your password
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Enter your email address and we’ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-white focus:border-black dark:focus:border-white focus:ring-0"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center rounded-md border border-black dark:border-white bg-black dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-black hover:opacity-90 transition"
                >
                  Send Reset Link
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Remembered your password?{' '}
                    <Link
                      href="/login"
                      className="font-medium text-black dark:text-white hover:underline"
                    >
                      Back to login
                    </Link>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                We’ve sent a reset link to <span className="font-medium">{email}</span>. Follow the
                link to create a new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-black dark:border-white px-5 py-2 text-sm font-medium text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
