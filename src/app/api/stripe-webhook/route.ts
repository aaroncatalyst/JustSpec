import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id
    if (!userId) return NextResponse.json({ received: true })

    if (session.mode === 'subscription') {
      const priceId = session.metadata?.price_id
      let plan = 'starter'
      let rfq_credits = 2
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = 'pro'
        rfq_credits = 10
      }
      await supabase.from('users').update({ plan, rfq_credits }).eq('id', userId)
    } else if (session.mode === 'payment') {
      const { data: userData } = await supabase
        .from('users')
        .select('rfq_credits')
        .eq('id', userId)
        .single()
      await supabase
        .from('users')
        .update({ rfq_credits: (userData?.rfq_credits ?? 0) + 1 })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    // Look up user by Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()
    if (userData) {
      await supabase
        .from('users')
        .update({ plan: 'free', rfq_credits: 0 })
        .eq('id', userData.id)
    }
  }

  return NextResponse.json({ received: true })
}
