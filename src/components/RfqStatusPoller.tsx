'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATUS_STEPS = [
  { status: 'draft', label: 'Starting...' },
  { status: 'suppliers_identified', label: 'Found suppliers, generating emails...' },
  { status: 'rfqs_sent', label: 'Emails sent! Waiting for responses...' },
]

const POLL_INTERVAL_MS = 5000
const TIMEOUT_MS = 5 * 60 * 1000

interface Props {
  rfqId: string
  initialStatus: string
}

export default function RfqStatusPoller({ rfqId, initialStatus }: Props) {
  const router = useRouter()
  const [rfqStatus, setRfqStatus] = useState(initialStatus)
  const [timedOut, setTimedOut] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }

  useEffect(() => {
    const supabase = createClient()

    timeoutRef.current = setTimeout(() => {
      stopPolling()
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

      if (data.status === 'rfqs_sent' || data.status === 'complete') {
        stopPolling()
        router.refresh()
      }
    }, POLL_INTERVAL_MS)

    return () => stopPolling()
  }, [rfqId, router])

  const currentStepIndex = STATUS_STEPS.reduce(
    (acc, step, i) => step.status === rfqStatus ? i : acc,
    0
  )

  if (timedOut) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-500">Taking longer than expected — check back in a few minutes.</p>
        <button
          onClick={() => window.location.reload()}
          className="self-start text-xs text-[#1a6b4a] underline hover:no-underline"
        >
          Refresh now
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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
        This usually takes 60–90 seconds.
      </p>
    </div>
  )
}
