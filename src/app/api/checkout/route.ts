import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { price_id, mode } = await request.json()

  const origin = request.headers.get('origin') || request.nextUrl.origin

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: price_id, quantity: 1 }],
    mode,
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url: `${origin}/`,
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { user_id: user.id, price_id },
  })

  return NextResponse.json({ url: session.url })
}
