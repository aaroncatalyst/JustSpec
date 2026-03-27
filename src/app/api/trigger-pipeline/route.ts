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

  // Await the fetch with a 5s timeout — ensures the request is fully sent to Railway
  // before returning, but doesn't wait for the 90s pipeline response.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    await fetch(`${pipelineUrl}/api/process-rfq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfq_id,
        supabase_url: supabaseUrl,
        supabase_service_key: serviceKey,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    // AbortError is expected — we intentionally timeout after 5s
    // Any other error means the request didn't reach Railway
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Pipeline trigger failed:', err)
      return NextResponse.json({ error: 'Failed to trigger pipeline' }, { status: 500 })
    }
  } finally {
    clearTimeout(timeout)
  }

  return NextResponse.json({ status: 'processing' })
}
