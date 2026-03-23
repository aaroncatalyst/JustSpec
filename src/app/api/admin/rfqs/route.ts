import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const adminPassword = request.headers.get('X-Admin-Password')
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'justspec2026'
  if (adminPassword !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .in('status', ['rfqs_sent', 'awaiting_responses'])
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
