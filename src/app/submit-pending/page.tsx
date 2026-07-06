'use client'

/**
 * Landing page for the magic-link return path.
 *
 * A logged-out visitor who submitted the RFQ form had their spec saved to
 * localStorage and was emailed a magic link. That link authenticates them and
 * (via /auth/callback?next=/submit-pending) drops them here, where we finish
 * the job: create the RFQ they already filled out and start their report.
 *
 * This removes the old wall where submitting bounced users to signup and threw
 * their spec away.
 */
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { fireConversion, trackEvent } from '@/lib/gtag'
import {
  PENDING_RFQ_KEY,
  getEligibility,
  insertRfqAndStart,
  type RfqSpec,
} from '@/lib/rfq'

type State = 'working' | 'no-pending' | 'no-credits' | 'error'

export default function SubmitPendingPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('working')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Guard against React StrictMode double-invocation creating two RFQs
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    ;(async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Not authenticated (link expired or opened in a different browser)
      if (!user) {
        router.replace('/login?message=Please+sign+in+to+finish+your+request')
        return
      }

      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_RFQ_KEY) : null
      if (!raw) {
        setState('no-pending')
        return
      }

      let saved: Partial<RfqSpec>
      try {
        saved = JSON.parse(raw)
      } catch {
        window.localStorage.removeItem(PENDING_RFQ_KEY)
        setState('no-pending')
        return
      }

      if (!saved.product_description) {
        window.localStorage.removeItem(PENDING_RFQ_KEY)
        setState('no-pending')
        return
      }

      try {
        const { freeEligible, credits } = await getEligibility(supabase, user.id)

        // Existing user who already used their free RFQ and has no credits:
        // keep their spec, send them to pricing rather than silently failing.
        if (!freeEligible && credits <= 0) {
          setState('no-credits')
          return
        }

        const spec: RfqSpec = {
          product_description: saved.product_description,
          product_category: saved.product_category ?? null,
          material: saved.material ?? null,
          quantities: saved.quantities ?? null,
          destination_country: saved.destination_country ?? 'US',
          supplier_region: saved.supplier_region ?? 'China',
          compliance: saved.compliance ?? null,
          reference_links: saved.reference_links ?? null,
          additional_notes: saved.additional_notes ?? null,
          file_urls: null,
          is_free: freeEligible,
        }

        const rfqId = await insertRfqAndStart(supabase, user.id, spec)

        // Conversion tracking — fires now that the RFQ actually exists
        fireConversion(freeEligible ? 0 : 39.0)
        trackEvent('spec_submitted', { is_free: freeEligible, source: 'magic_link' })

        window.localStorage.removeItem(PENDING_RFQ_KEY)
        router.replace(`/dashboard/rfq/${rfqId}`)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
        setState('error')
      }
    })()
  }, [router])

  return (
    <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {state === 'working' && (
          <>
            <svg
              className="animate-spin h-8 w-8 text-[#1a6b4a] mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <h2 className="text-lg font-semibold text-[#1a1a18] mb-1">Starting your report…</h2>
            <p className="text-sm text-[#8a8a82]">Submitting your spec and finding manufacturers.</p>
          </>
        )}

        {state === 'no-pending' && (
          <>
            <h2 className="text-lg font-semibold text-[#1a1a18] mb-2">You&apos;re signed in</h2>
            <p className="text-sm text-[#8a8a82] mb-6">
              We couldn&apos;t find a pending request — it may have already been submitted.
            </p>
            <Link href="/dashboard" className="text-[#1a6b4a] font-medium text-sm hover:underline">
              Go to your dashboard →
            </Link>
          </>
        )}

        {state === 'no-credits' && (
          <>
            <h2 className="text-lg font-semibold text-[#1a1a18] mb-2">One more step</h2>
            <p className="text-sm text-[#8a8a82] mb-6">
              You&apos;ve used your free report. Choose a plan to submit this spec — we&apos;ve saved it for you.
            </p>
            <Link href="/#pricing" className="text-[#1a6b4a] font-medium text-sm hover:underline">
              See plans →
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <h2 className="text-lg font-semibold text-[#1a1a18] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#8a8a82] mb-6">{errorMsg ?? 'Please try again.'}</p>
            <Link href="/#get-started" className="text-[#1a6b4a] font-medium text-sm hover:underline">
              Back to the form →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
