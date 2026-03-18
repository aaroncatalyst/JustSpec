import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProcessRfqButton from '@/components/ProcessRfqButton'

interface Props {
  params: Promise<{ id: string }>
}

interface PriceTier {
  quantity: number
  unit_price: number
  currency: string
}

interface Quote {
  id: string
  supplier_name: string
  price_tiers: PriceTier[]
  moq: number | null
  lead_time_days: number | null
  payment_terms: string | null
  tooling_fee: number | null
  existing_mold: boolean | null
  fda_compliant: boolean | null
  landed_cost_estimate: Record<string, number> | null
}

const STATUS_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'suppliers_identified', label: 'Suppliers Found' },
  { key: 'rfqs_sent', label: 'RFQs Sent' },
  { key: 'awaiting_responses', label: 'Awaiting Responses' },
  { key: 'complete', label: 'Complete' },
]

function getStatusIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)
  return idx === -1 ? 0 : idx
}

function getFobAtQty(priceTiers: PriceTier[], qty: number): number | null {
  if (!priceTiers?.length) return null
  const eligible = priceTiers
    .filter(t => t.quantity <= qty)
    .sort((a, b) => b.quantity - a.quantity)
  if (eligible.length) return eligible[0].unit_price
  return priceTiers.reduce((min, t) => t.unit_price < min ? t.unit_price : min, priceTiers[0].unit_price)
}

// FOB + $0.15 freight + 5.3% duty + $1,900 fixed costs ÷ qty
function calcLandedCost(fob: number, qty: number): number {
  return fob + 0.15 + fob * 0.053 + 1900 / qty
}

function rankQuotes(quotes: Quote[], quantities: number[]): Quote[] {
  if (!quantities.length) return quotes
  const sorted = [...quantities].sort((a, b) => a - b)
  const pivot = sorted[Math.floor(sorted.length / 2)]
  return [...quotes].sort((a, b) => {
    const aFob = getFobAtQty(a.price_tiers, pivot)
    const bFob = getFobAtQty(b.price_tiers, pivot)
    if (aFob === null) return 1
    if (bFob === null) return -1
    return calcLandedCost(aFob, pivot) - calcLandedCost(bFob, pivot)
  })
}

export default async function RfqPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rfq } = await supabase
    .from('rfqs')
    .select('*')
    .eq('id', id)
    .single()

  if (!rfq || rfq.user_id !== user.id) notFound()

  const { data: userData } = await supabase
    .from('users')
    .select('rfq_credits')
    .eq('id', user.id)
    .single()

  const credits: number = userData?.rfq_credits ?? 0

  const { data: rawQuotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('rfq_id', id)

  const quotes: Quote[] = rawQuotes ?? []
  const quantities: number[] = (rfq.quantities ?? []).slice().sort((a: number, b: number) => a - b)
  const rankedQuotes = rankQuotes(quotes, quantities)
  const statusIdx = getStatusIndex(rfq.status)
  const pivotQty = quantities[Math.floor(quantities.length / 2)] ?? quantities[0]

  const submittedDate = new Date(rfq.created_at)
  const estimatedDate = new Date(submittedDate.getTime() + 48 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <header className="bg-white border-b border-[#e8e8e2]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#8a8a82] hover:text-[#1a1a18] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
            </svg>
            Back to dashboard
          </Link>
          <span className="text-[#e8e8e2]">/</span>
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#1a1a18]">just</span>
            <span className="text-[#1a6b4a]">spec</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Page title + status badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a18] leading-snug">
              {rfq.product_description?.slice(0, 80)}
              {rfq.product_description?.length > 80 ? '…' : ''}
            </h1>
            <p className="text-sm text-[#8a8a82] mt-1">
              Submitted {submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${
            rfq.status === 'complete'
              ? 'bg-[#eaf3ef] text-[#1a6b4a]'
              : rfq.status === 'draft'
              ? 'bg-[#f0f0ec] text-[#8a8a82]'
              : 'bg-amber-50 text-amber-700'
          }`}>
            {rfq.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </span>
        </div>

        {/* Status timeline */}
        <div className="bg-white border border-[#e8e8e2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider">Progress</h2>
            {rfq.status === 'draft' && <ProcessRfqButton rfqId={rfq.id} userCredits={credits} />}
          </div>
          <div className="flex items-start">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < statusIdx
              const isCurrent = i === statusIdx
              return (
                <div key={step.key} className="flex items-start flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone
                        ? 'bg-[#1a6b4a] text-white'
                        : isCurrent
                        ? 'border-2 border-[#1a6b4a] text-[#1a6b4a]'
                        : 'bg-[#f0f0ec] text-[#8a8a82]'
                    }`}>
                      {isDone ? (
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M13.707 4.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L7 9.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`mt-2 text-xs text-center max-w-[72px] leading-tight ${
                      isCurrent ? 'text-[#1a6b4a] font-semibold' : isDone ? 'text-[#1a1a18]' : 'text-[#8a8a82]'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-4 ${i < statusIdx ? 'bg-[#1a6b4a]' : 'bg-[#e8e8e2]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Spec details */}
        <div className="bg-white border border-[#e8e8e2] rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider mb-5">Spec Details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
            <div className="sm:col-span-2">
              <dt className="text-xs text-[#8a8a82] mb-1">Product Description</dt>
              <dd className="text-[#1a1a18] leading-relaxed">{rfq.product_description}</dd>
            </div>

            {rfq.product_category && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Category</dt>
                <dd className="text-[#1a1a18]">{rfq.product_category}</dd>
              </div>
            )}

            {rfq.material && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Material</dt>
                <dd className="text-[#1a1a18]">{rfq.material}</dd>
              </div>
            )}

            {quantities.length > 0 && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Quantities</dt>
                <dd className="text-[#1a1a18]">{quantities.map((q: number) => q.toLocaleString()).join(' / ')} units</dd>
              </div>
            )}

            {rfq.destination_country && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Destination</dt>
                <dd className="text-[#1a1a18]">{rfq.destination_country}</dd>
              </div>
            )}

            {rfq.supplier_region && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Supplier Region</dt>
                <dd className="text-[#1a1a18]">{rfq.supplier_region}</dd>
              </div>
            )}

            {rfq.compliance && rfq.compliance.length > 0 && (
              <div>
                <dt className="text-xs text-[#8a8a82] mb-1">Compliance</dt>
                <dd className="flex flex-wrap gap-1.5 mt-1">
                  {rfq.compliance.map((c: string) => (
                    <span key={c} className="bg-[#eaf3ef] text-[#1a6b4a] text-xs font-medium px-2 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {rfq.additional_notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#8a8a82] mb-1">Additional Notes</dt>
                <dd className="text-[#1a1a18] leading-relaxed">{rfq.additional_notes}</dd>
              </div>
            )}

            {rfq.reference_links && rfq.reference_links.filter(Boolean).length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#8a8a82] mb-1">Reference Links</dt>
                <dd className="flex flex-col gap-1.5 mt-1">
                  {rfq.reference_links.filter(Boolean).map((link: string, i: number) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1a6b4a] hover:underline break-all"
                    >
                      {link}
                    </a>
                  ))}
                </dd>
              </div>
            )}

            {rfq.file_urls && rfq.file_urls.filter(Boolean).length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#8a8a82] mb-1">Attachments</dt>
                <dd className="flex flex-wrap gap-2 mt-1">
                  {rfq.file_urls.filter(Boolean).map((url: string, i: number) => {
                    const filename = url.split('/').pop()?.split('?')[0] ?? `File ${i + 1}`
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-[#f0f0ec] hover:bg-[#e8e8e2] text-[#1a1a18] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-[#8a8a82]" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M4 1a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6.414A2 2 0 0013.414 5L10 1.586A2 2 0 008.586 1H4zm5 5V2.5L12.5 6H9z" clipRule="evenodd" />
                        </svg>
                        {filename}
                      </a>
                    )
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Quotes: waiting state or comparison table */}
        {quotes.length === 0 ? (
          <div className="bg-white border border-[#e8e8e2] rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[#1a1a18] mb-2">Waiting for supplier responses</h3>
            <p className="text-sm text-[#8a8a82] max-w-sm mx-auto leading-relaxed">
              Quotes typically arrive within 24–48 hours. A full comparison table will appear here once suppliers respond.
            </p>
            <p className="text-xs text-[#8a8a82] mt-3">
              Submitted {submittedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              {' '}· Est. complete by{' '}
              {estimatedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#e8e8e2] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider">
                Supplier Quotes — {quotes.length} response{quotes.length !== 1 ? 's' : ''}
              </h2>
              <span className="text-xs text-[#8a8a82]">Ranked by landed cost</span>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#e8e8e2]">
                    <th className="text-left text-xs font-semibold text-[#8a8a82] pb-3 pr-4 whitespace-nowrap">Supplier</th>
                    {quantities.map((qty: number) => (
                      <th key={qty} className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">
                        FOB @ {qty.toLocaleString()}
                      </th>
                    ))}
                    <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">
                      Landed{pivotQty ? ` @ ${pivotQty.toLocaleString()}` : ''}
                    </th>
                    <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">MOQ</th>
                    <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Lead Time</th>
                    <th className="text-left text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Payment Terms</th>
                    <th className="text-right text-xs font-semibold text-[#8a8a82] pb-3 px-3 whitespace-nowrap">Tooling</th>
                    <th className="text-center text-xs font-semibold text-[#8a8a82] pb-3 pl-3 whitespace-nowrap">FDA</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedQuotes.map((quote, i) => {
                    const pivotFob = pivotQty ? getFobAtQty(quote.price_tiers, pivotQty) : null
                    const landedCost = pivotFob && pivotQty ? calcLandedCost(pivotFob, pivotQty) : null
                    const isWinner = i === 0

                    return (
                      <tr
                        key={quote.id}
                        className={`border-b border-[#f0f0ec] last:border-0 ${isWinner ? 'bg-[#eaf3ef]/40' : ''}`}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            {isWinner && (
                              <span className="bg-[#1a6b4a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Best
                              </span>
                            )}
                            <span className={`font-medium ${isWinner ? 'text-[#1a6b4a]' : 'text-[#1a1a18]'}`}>
                              {quote.supplier_name}
                            </span>
                          </div>
                        </td>

                        {quantities.map((qty: number) => {
                          const fob = getFobAtQty(quote.price_tiers, qty)
                          return (
                            <td key={qty} className="py-4 px-3 text-right font-mono text-[#1a1a18] tabular-nums">
                              {fob !== null ? `$${fob.toFixed(4)}` : '—'}
                            </td>
                          )
                        })}

                        <td className="py-4 px-3 text-right font-mono font-semibold text-[#1a1a18] tabular-nums">
                          {landedCost !== null ? `$${landedCost.toFixed(4)}` : '—'}
                        </td>

                        <td className="py-4 px-3 text-right text-[#1a1a18]">
                          {quote.moq ? quote.moq.toLocaleString() : '—'}
                        </td>

                        <td className="py-4 px-3 text-right text-[#1a1a18]">
                          {quote.lead_time_days ? `${quote.lead_time_days} days` : '—'}
                        </td>

                        <td className="py-4 px-3 text-left text-[#1a1a18]">
                          <span className="block max-w-[160px] truncate" title={quote.payment_terms ?? ''}>
                            {quote.payment_terms ?? '—'}
                          </span>
                        </td>

                        <td className="py-4 px-3 text-right text-[#1a1a18]">
                          {quote.existing_mold === true
                            ? <span className="text-[#1a6b4a]">None</span>
                            : quote.tooling_fee
                            ? `$${quote.tooling_fee.toLocaleString()}`
                            : '—'}
                        </td>

                        <td className="py-4 pl-3 text-center">
                          {quote.fda_compliant === true ? (
                            <span className="text-[#1a6b4a] font-semibold">Yes</span>
                          ) : quote.fda_compliant === false ? (
                            <span className="text-red-500 font-semibold">No</span>
                          ) : (
                            <span className="text-[#8a8a82]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#8a8a82] mt-4 pt-4 border-t border-[#f0f0ec]">
              Landed cost = FOB + $0.15/unit ocean freight + 5.3% import duty + $1,900 fixed costs (bond + customs entry + drayage + inspection) ÷ quantity
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
