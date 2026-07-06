/**
 * Shared RFQ creation logic used by both:
 *  - SpecForm (logged-in submit, with file uploads), and
 *  - /submit-pending (magic-link return path, restores a saved spec).
 *
 * Keeping this in one place ensures the two entry points can't drift apart.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const PENDING_RFQ_KEY = 'justspec_pending_rfq'

/** The serializable spec payload. Note: File attachments are NOT included here —
 *  File objects can't survive a localStorage round-trip, so the magic-link path
 *  submits text fields only (attachments can be added from the dashboard). */
export interface RfqSpec {
  product_description: string
  product_category?: string | null
  material?: string | null
  quantities?: number[] | null
  destination_country?: string | null
  supplier_region: string
  compliance?: string[] | null
  reference_links?: string[] | null
  additional_notes?: string | null
  file_urls?: string[] | null
  is_free: boolean
}

/** Free-eligible = free plan AND no prior RFQs; otherwise needs a paid credit. */
export async function getEligibility(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ freeEligible: boolean; credits: number }> {
  const [{ data: userData }, { count: rfqCount }] = await Promise.all([
    supabase.from('users').select('rfq_credits, plan').eq('id', userId).single(),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const freeEligible = userData?.plan === 'free' && (rfqCount ?? 0) === 0
  return { freeEligible, credits: userData?.rfq_credits ?? 0 }
}

/** Insert the RFQ (RLS-scoped to the authed user), burn a credit if paid,
 *  and fire-and-forget the pipeline trigger. Returns the new RFQ id. */
export async function insertRfqAndStart(
  supabase: SupabaseClient,
  userId: string,
  spec: RfqSpec,
): Promise<string> {
  const { data, error } = await supabase
    .from('rfqs')
    .insert({
      user_id: userId,
      product_description: spec.product_description,
      product_category: spec.product_category || null,
      material: spec.material || null,
      quantities: spec.quantities && spec.quantities.length > 0 ? spec.quantities : null,
      destination_country: spec.destination_country || 'US',
      supplier_region: spec.is_free ? 'China' : spec.supplier_region,
      compliance: spec.compliance && spec.compliance.length > 0 ? spec.compliance : null,
      reference_links:
        spec.reference_links && spec.reference_links.length > 0 ? spec.reference_links : null,
      additional_notes: spec.additional_notes || null,
      file_urls: spec.file_urls && spec.file_urls.length > 0 ? spec.file_urls : null,
      is_free: spec.is_free,
      status: 'suppliers_identified',
    })
    .select('id')
    .single()

  if (error) throw error
  const rfqId = data.id as string

  // Only paid submissions consume a credit
  if (!spec.is_free) {
    await supabase.rpc('decrement_credits', { uid: userId })
  }

  // Fire-and-forget: hand the RFQ to the SourcePilot backend
  fetch('/api/trigger-pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfq_id: rfqId }),
  }).catch((err) => console.error('Pipeline trigger error:', err))

  return rfqId
}
