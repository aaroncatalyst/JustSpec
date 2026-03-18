'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
const CREDIT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_CREDIT_PRICE_ID

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: 'per RFQ',
    description: 'Perfect for first-time sourcers.',
    features: [
      '1 RFQ submission',
      'Up to 10 supplier contacts',
      'Structured quote report',
      'Email delivery',
    ],
    cta: 'Get started',
    highlight: false,
    priceId: STARTER_PRICE_ID,
    mode: 'subscription' as const,
  },
  {
    name: 'Pro',
    price: '$149',
    period: 'per month',
    description: 'For teams sourcing regularly.',
    features: [
      '5 RFQs per month',
      'Up to 15 suppliers per RFQ',
      'Landed cost estimates',
      'Priority processing',
      'Dashboard access',
    ],
    cta: 'Start free trial',
    highlight: true,
    priceId: PRO_PRICE_ID,
    mode: 'subscription' as const,
  },
  {
    name: 'Add-on',
    price: '$29',
    period: 'per extra RFQ',
    description: 'Top up when you need more.',
    features: [
      'Add RFQs to any plan',
      'Same turnaround guarantee',
      'Never expires',
    ],
    cta: 'Buy credits',
    highlight: false,
    priceId: CREDIT_PRICE_ID,
    mode: 'payment' as const,
  },
]

export default function PricingSection() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(plan: typeof plans[number]) {
    setLoadingPlan(plan.name)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signup')
        return
      }
      if (!plan.priceId) {
        setError('Pricing not configured. Please contact support.')
        return
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: plan.priceId, mode: plan.mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to start checkout')
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="py-20 max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold text-[#1a1a18] mb-3">Pricing</h2>
        <p className="text-[#8a8a82] max-w-md mx-auto">
          Pay per RFQ or subscribe for regular sourcing. Your first RFQ is always free.
        </p>
      </div>
      {error && (
        <p className="text-center text-sm text-red-500 mb-6">{error}</p>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 flex flex-col gap-5 ${
              plan.highlight
                ? 'border-[#1a6b4a] bg-[#1a6b4a] text-white shadow-lg'
                : 'border-[#e8e8e2] bg-white'
            }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                  plan.highlight ? 'text-[#a8d5c2]' : 'text-[#8a8a82]'
                }`}
              >
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`text-sm ${plan.highlight ? 'text-[#a8d5c2]' : 'text-[#8a8a82]'}`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`text-sm mt-1 ${plan.highlight ? 'text-[#c5e8d8]' : 'text-[#8a8a82]'}`}
              >
                {plan.description}
              </p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <svg
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      plan.highlight ? 'text-[#a8d5c2]' : 'text-[#1a6b4a]'
                    }`}
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L7 8.586l4.293-4.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className={plan.highlight ? 'text-white' : 'text-[#1a1a18]'}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(plan)}
              disabled={loadingPlan === plan.name}
              className={`text-center py-3 rounded-lg font-medium transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                plan.highlight
                  ? 'bg-white text-[#1a6b4a] hover:bg-[#f0f9f4]'
                  : 'bg-[#1a6b4a] text-white hover:bg-[#155a3d]'
              }`}
            >
              {loadingPlan === plan.name ? 'Redirecting…' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
