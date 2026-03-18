'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  rfqId: string
  userCredits: number
}

export default function ProcessRfqButton({ rfqId, userCredits }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const supabase = createClient()
    try {
      // Double-check credits from DB (prop may be stale)
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

      // Optimistic decrement before pipeline runs
      await supabase.rpc('decrement_credits', { uid: user.id })

      const res = await fetch('/api/trigger-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfq_id: rfqId }),
      })

      if (!res.ok) {
        // Pipeline failed — restore the credit
        await supabase.rpc('increment_credits', { uid: user.id })
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 bg-[#1a6b4a] hover:bg-[#155a3e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing… this takes about 60 seconds
          </>
        ) : (
          'Process RFQ'
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
