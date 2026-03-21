import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const adminPassword = request.headers.get('X-Admin-Password')
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'justspec2026'
  if (adminPassword !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { quote_id, raw_email } = body

  if (!quote_id || !raw_email) {
    return NextResponse.json({ error: 'quote_id and raw_email are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, rfq_id')
    .eq('id', quote_id)
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .select('id, product_description, quantities')
    .eq('id', quote.rfq_id)
    .single()

  if (rfqError || !rfq) {
    return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  }

  const pipelineUrl = process.env.PIPELINE_API_URL
  if (!pipelineUrl) {
    return NextResponse.json({ error: 'PIPELINE_API_URL not configured' }, { status: 500 })
  }

  const upstream = await fetch(`${pipelineUrl}/api/parse-response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quote_id,
      raw_email,
      product_description: rfq.product_description,
      quantities: rfq.quantities,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ detail: upstream.statusText }))
    return NextResponse.json({ error: err.detail ?? upstream.statusText }, { status: upstream.status })
  }

  const data = await upstream.json()
  return NextResponse.json(data)
}
