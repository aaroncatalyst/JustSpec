import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  return NextResponse.json({ ok: true })
}
