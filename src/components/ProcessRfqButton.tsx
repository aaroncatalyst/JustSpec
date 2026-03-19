'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  rfqId: string
  userCredits: number
}

type RfqStatus = 'draft' | 'suppliers_identified' | 'rfqs_sent' | string

const STATUS_STEPS: { status: RfqStatus; label: string }[] = [
  { status: 'draft', label: 'Starting...' },
  { status: 'suppliers_identified', label: 'Found suppliers, generating emails...' },
  { status: 'rfqs_sent', label: 'Emails sent! Waiting for responses...' },
]

const POLL_INTERVAL_MS = 5000
const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

export default function ProcessRfqButton({ rfqId, userCredits }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rfqStatus, setRfqStatus] = useState<RfqStatus>('draft')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  if (userCredits <= 0) {
    return (
      <Link
        href="/#pricing"
        className="flex items-center gap-2 bg-[#1a6b4a] hover:bg-[#155a3e] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Upgrade to process
      </Link>
    )
  }

  async function handleClick() {
    setLoading(true)
    setError(null)
    setDone(false)
    setTimedOut(false)
    setRfqStatus('draft')
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('rfq_credits')
        .eq('id', user.id)
        .single()

      if (!userData || userData.rfq_credits <= 0) {
        throw new Error('No credits remaining — upgrade your plan')
      }

      await supabase.rpc('decrement_credits', { uid: user.id })

      const res = await fetch('/api/trigger-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfq_id: rfqId }),
      })

      if (!res.ok) {
        await supabase.rpc('increment_credits', { uid: user.id })
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      // Pipeline is running fire-and-forget — start polling Supabase for status changes
      timeoutRef.current = setTimeout(() => {
        stopPolling()
        setLoading(false)
        setTimedOut(true)
      }, TIMEOUT_MS)

      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('rfqs')
          .select('status')
          .eq('id', rfqId)
          .single()

        if (!data) return
        setRfqStatus(data.status)

        if (data.status === 'rfqs_sent') {
          stopPolling()
          setLoading(false)
          setDone(true)
          setTimeout(() => router.refresh(), 1500)
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const currentStepIndex = STATUS_STEPS.reduce(
    (acc, step, i) => step.status === rfqStatus ? i : acc,
    0
  )

  if (done) {
    return (
      <div className="flex items-center gap-2 text-[#1a6b4a] text-xs font-semibold">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Done! Refreshing...
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="text-xs text-gray-500">Taking longer than expected — check back in a few minutes.</p>
        <button
          onClick={() => router.refresh()}
          className="text-xs text-[#1a6b4a] underline hover:no-underline"
        >
          Refresh now
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 w-64">
        <div className="flex flex-col gap-1.5">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i === currentStepIndex
            const isDone = i < currentStepIndex
            return (
              <div key={step.status} className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  {isDone ? (
                    <svg className="w-3.5 h-3.5 text-[#1a6b4a]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : isActive ? (
                    <svg className="w-3 h-3 animate-spin text-[#1a6b4a]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </span>
                <span className={`text-xs ${isActive ? 'text-gray-800 font-medium' : isDone ? 'text-[#1a6b4a]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 leading-tight">
          This usually takes 60–90 seconds.<br />Please don&apos;t close this page.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 bg-[#1a6b4a] hover:bg-[#155a3e] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Process RFQ
      </button>
      {error && (
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={handleClick}
            className="text-xs text-[#1a6b4a] underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
