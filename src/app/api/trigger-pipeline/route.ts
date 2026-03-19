import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { rfq_id } = body

  if (!rfq_id || typeof rfq_id !== 'string') {
    return NextResponse.json({ error: 'rfq_id is required' }, { status: 400 })
  }

  const pipelineUrl = process.env.PIPELINE_API_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!pipelineUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Pipeline not configured — set PIPELINE_API_URL and SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  // Verify this RFQ belongs to the authenticated user before triggering
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('id, user_id')
    .eq('id', rfq_id)
    .single()

  if (!rfq || rfq.user_id !== user.id) {
    return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  }

  // Fire-and-forget: don't await the pipeline response — it takes 60+ seconds
  // and Vercel functions timeout at ~10-15s. FastAPI updates Supabase as it progresses.
  fetch(`${pipelineUrl}/api/process-rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rfq_id,
      supabase_url: supabaseUrl,
      supabase_service_key: serviceKey,
    }),
  }).catch(err => console.error('Pipeline fire-and-forget error:', err))

  return NextResponse.json({ status: 'processing' })
}
