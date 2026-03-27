import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const adminPassword = request.headers.get('X-Admin-Password')
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'justspec2026'
  if (adminPassword !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rfq_id } = await request.json()
  if (!rfq_id) {
    return NextResponse.json({ error: 'rfq_id is required' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase
    .from('rfqs')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', rfq_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch RFQ details
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('user_id, product_description')
    .eq('id', rfq_id)
    .single()

  if (rfq) {
    // Fetch user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', rfq.user_id)
      .single()

    // Count quotes with parsed price_tiers
    const { count: quoteCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('rfq_id', rfq_id)
      .not('price_tiers', 'is', null)

    if (user?.email) {
      const productDescription = rfq.product_description
      const count = quoteCount ?? 0
      const resend = new Resend(process.env.RESEND_API_KEY)

      const { error: emailError } = await resend.emails.send({
        from: 'JustSpec <notifications@justspec.co>',
        to: user.email,
        subject: `Your supplier quotes are ready — ${productDescription}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a1a18; font-size: 24px; margin-bottom: 8px;">Your quotes are ready</h1>
            <p style="color: #6a6a62; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Your supplier comparison report for <strong>"${productDescription}"</strong> is ready.
              We received quotes from <strong>${count} supplier${count !== 1 ? 's' : ''}</strong>.
            </p>
            <p style="color: #6a6a62; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              View your full comparison table with pricing, lead times, and landed cost analysis:
            </p>
            <a href="https://justspec.co/dashboard/rfq/${rfq_id}"
               style="display: inline-block; background: #1a6b4a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Report →
            </a>
            <p style="color: #8a8a82; font-size: 13px; margin-top: 40px; border-top: 1px solid #e8e8e2; padding-top: 20px;">
              JustSpec · Supplier quotes, delivered.<br>
              <a href="https://justspec.co" style="color: #1a6b4a;">justspec.co</a>
            </p>
          </div>
        `
      })

      if (emailError) {
        console.error('[complete-rfq] Failed to send notification email:', emailError)
      } else {
        console.log(`[complete-rfq] Notification email sent to ${user.email} for RFQ ${rfq_id}`)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
