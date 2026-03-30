'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REPORT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID  // $39/report
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID         // $149/month
const MANAGED_URL =
  process.env.NEXT_PUBLIC_MANAGED_SOURCING_URL ?? 'mailto:aaron@justspec.co'

// ── Shared primitives ────────────────────────────────────────────────────────

function Check({ muted, dark }: { muted?: boolean; dark?: boolean }) {
  const color = dark ? 'text-[#5a9a7a]' : muted ? 'text-[#a8d5c2]' : 'text-[#1a6b4a]'
  return (
    <svg className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L7 8.586l4.293-4.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function scrollToForm() {
  const el = document.getElementById('get-started')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => {
    const field = el.querySelector<HTMLElement>('input, textarea, select')
    field?.focus()
  }, 600)
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PricingSection() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(
    name: string,
    priceId: string | undefined,
    mode: 'payment' | 'subscription',
  ) {
    setLoadingPlan(name)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signup'); return }
      if (!priceId) { setError('Pricing not configured. Please contact support.'); return }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start checkout'); return }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="py-20 md:py-24 bg-[#fafaf7] border-y border-[#e8e8e2]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#1a6b4a] uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a18] mb-3">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="text-[#8a8a82] max-w-sm mx-auto text-base">
            No subscription required to get started — your first report is on us.
          </p>
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 mb-8">{error}</p>
        )}

        {/*
          Grid: 1-col mobile → 2-col tablet → 4-col desktop.
          The Managed column wraps the card in a flex column so the
          "— or —" callout sits above it without disrupting grid alignment.
          items-start lets each column be its natural height.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

          {/* ── FREE ────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#1a6b4a] bg-[#1a6b4a] text-white shadow-lg flex flex-col gap-6 p-7">
            <div className="inline-flex self-start items-center bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Start here
            </div>

            <div>
              <p className="text-xs font-semibold text-[#a8d5c2] uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-bold">$0</span>
              </div>
              <p className="text-[#c5e8d8] text-sm mt-1">Your first quote report, free</p>
            </div>

            <ul className="flex flex-col gap-2.5 flex-1">
              {[
                '1 RFQ submission',
                'Up to 5 US manufacturers',
                'Basic comparison report',
                'Email delivery',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white">
                  <Check muted />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2">
              <button
                onClick={scrollToForm}
                className="text-center py-3.5 rounded-lg font-semibold text-sm bg-white text-[#1a6b4a] hover:bg-[#f0f9f4] transition-colors"
              >
                Get your free report →
              </button>
              <p className="text-center text-xs text-[#a8d5c2]">No credit card required</p>
            </div>
          </div>

          {/* ── PER REPORT ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#e8e8e2] bg-white flex flex-col gap-5 p-7">
            <div>
              <p className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider mb-1">Per Report</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1a1a18]">$39</span>
                <span className="text-sm text-[#8a8a82]">/ report</span>
              </div>
              <p className="text-[#8a8a82] text-sm mt-1">Pay as you go, no commitment.</p>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {[
                'Up to 15 suppliers (US + China)',
                'Full comparison report',
                'Landed cost estimates',
                'Email + dashboard access',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check />
                  <span className="text-[#1a1a18]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('Per Report', REPORT_PRICE_ID, 'payment')}
              disabled={loadingPlan === 'Per Report'}
              className="text-center py-3 rounded-lg font-medium text-sm bg-[#1a6b4a] text-white hover:bg-[#155a3d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingPlan === 'Per Report' ? 'Redirecting…' : 'Buy a report'}
            </button>
          </div>

          {/* ── PRO ─────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#e8e8e2] bg-white flex flex-col gap-5 p-7">
            <div>
              <p className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider mb-1">Pro</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1a1a18]">$149</span>
                <span className="text-sm text-[#8a8a82]">/ month</span>
              </div>
              <p className="text-[#8a8a82] text-sm mt-1">
                5 RFQs included —{' '}
                <span className="text-[#1a6b4a] font-medium">$29.80/ea effective</span>
              </p>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {[
                '5 RFQs / month',
                'Up to 15 suppliers per RFQ',
                'Landed cost estimates',
                'Priority processing',
                'Dashboard access',
                '$29 / extra RFQ',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check />
                  <span className="text-[#1a1a18]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('Pro', PRO_PRICE_ID, 'subscription')}
              disabled={loadingPlan === 'Pro'}
              className="text-center py-3 rounded-lg font-medium text-sm bg-[#1a6b4a] text-white hover:bg-[#155a3d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingPlan === 'Pro' ? 'Redirecting…' : 'Start free trial'}
            </button>
          </div>

          {/* ── MANAGED SOURCING ────────────────────────────────────────── */}
          {/*
            Wrapper div occupies the 4th grid column. The "— or —" callout
            sits above the card itself, providing a visual break from
            the three self-service tiers without requiring a separate row.
          */}
          <div className="flex flex-col gap-3">

            {/* Divider callout above the card */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-[#d4d4cc]" />
                <span className="text-xs text-[#8a8a82] font-medium">— or —</span>
                <div className="h-px flex-1 bg-[#d4d4cc]" />
              </div>
              <p className="text-xs text-[#8a8a82] text-center leading-snug">
                Don&apos;t want to manage sourcing yourself?
              </p>
            </div>

            {/* Dark premium card */}
            <div className="rounded-2xl border border-[#1e2e24] bg-[#111815] text-white flex flex-col gap-5 p-7 shadow-lg">
              <div>
                <p className="text-xs font-semibold text-[#5a9a7a] uppercase tracking-wider mb-1">
                  Managed Sourcing
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-white/50 text-sm mt-1 italic">
                  We source it. You just buy.
                </p>
              </div>

              <p className="text-white/60 text-sm leading-relaxed -mt-1">
                For businesses that don&apos;t want to manage supplier relationships.
              </p>

              <ul className="flex flex-col gap-2.5 flex-1">
                {[
                  'End-to-end sourcing & procurement',
                  'We negotiate pricing & manage quality',
                  'Inventory held at our warehouse',
                  'One invoice, one relationship — us',
                  'Typically 20–40% below distributor pricing',
                  'Ideal for $50K+/year recurring purchases',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                    <Check dark />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                <a
                  href={MANAGED_URL}
                  className="text-center py-3 rounded-lg font-semibold text-sm bg-[#1a6b4a] text-white hover:bg-[#155a3d] transition-colors"
                >
                  Talk to us →
                </a>
                <p className="text-center text-xs text-white/35 leading-snug">
                  Best for businesses spending $50K+/year on commodity inputs
                </p>
              </div>
            </div>

          </div>
          {/* ── end Managed column ────────────────────────────────────── */}

        </div>
      </div>
    </section>
  )
}
