'use client'

import { useState } from 'react'

interface PriceTier {
  quantity: number
  unit_price: number
  currency: string
}

interface Quote {
  id: string
  rfq_id: string
  supplier_name: string | null
  supplier_email: string | null
  status: string
  price_tiers: PriceTier[] | null
  moq: number | null
  lead_time_days: number | null
  payment_terms: string | null
  tooling_fee: number | null
  raw_email: string | null
  parsed_at: string | null
}

interface ParsedResult {
  supplier_name: string
  price_tiers: { quantity: number; unit_price: number }[]
  moq: number | null
  lead_time_days: number | null
}

interface RFQ {
  id: string
  status: string
  product_description: string | null
  created_at: string
  quantities: number[] | null
  quotes?: Quote[]
  loadingQuotes?: boolean
}

const ADMIN_PASSWORD = 'justspec2026'

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Password': ADMIN_PASSWORD,
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedRfqs, setExpandedRfqs] = useState<Set<string>>(new Set())
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({})
  const [parsedResults, setParsedResults] = useState<Record<string, ParsedResult>>({})
  const [parsingQuote, setParsingQuote] = useState<Set<string>>(new Set())
  const [parseErrors, setParseErrors] = useState<Record<string, string>>({})
  const [completingRfq, setCompletingRfq] = useState<Set<string>>(new Set())

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setAuthError('')
      fetchRfqs()
    } else {
      setAuthError('Incorrect password.')
    }
  }

  async function fetchRfqs() {
    setLoading(true)
    const res = await fetch('/api/admin/rfqs', { headers: adminHeaders() })
    if (res.ok) {
      const data = await res.json()
      setRfqs(data)
    }
    setLoading(false)
  }

  async function toggleRfq(rfq: RFQ) {
    const next = new Set(expandedRfqs)
    if (next.has(rfq.id)) {
      next.delete(rfq.id)
      setExpandedRfqs(next)
      return
    }
    next.add(rfq.id)
    setExpandedRfqs(next)

    if (!rfq.quotes) {
      setRfqs(prev => prev.map(r => r.id === rfq.id ? { ...r, loadingQuotes: true } : r))
      const res = await fetch(`/api/admin/quotes?rfq_id=${rfq.id}`, { headers: adminHeaders() })
      const data = res.ok ? await res.json() : []
      setRfqs(prev => prev.map(r => r.id === rfq.id ? { ...r, quotes: data, loadingQuotes: false } : r))
    }
  }

  async function parseResponse(quoteId: string) {
    const rawEmail = emailInputs[quoteId] ?? ''
    if (!rawEmail.trim()) return

    setParsingQuote(prev => new Set(prev).add(quoteId))
    setParseErrors(prev => { const n = { ...prev }; delete n[quoteId]; return n })

    try {
      const res = await fetch('/api/admin/parse-response', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ quote_id: quoteId, raw_email: rawEmail }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error ?? res.statusText)
      }
      const data: ParsedResult = await res.json()
      setParsedResults(prev => ({ ...prev, [quoteId]: data }))
      // Refresh quotes for this RFQ
      const rfq = rfqs.find(r => r.quotes?.some(q => q.id === quoteId))
      if (rfq) {
        const quotesRes = await fetch(`/api/admin/quotes?rfq_id=${rfq.id}`, { headers: adminHeaders() })
        const quotes = quotesRes.ok ? await quotesRes.json() : []
        setRfqs(prev => prev.map(r => r.id === rfq.id ? { ...r, quotes } : r))
      }
    } catch (err) {
      setParseErrors(prev => ({ ...prev, [quoteId]: (err as Error).message }))
    } finally {
      setParsingQuote(prev => { const n = new Set(prev); n.delete(quoteId); return n })
    }
  }

  async function markComplete(rfqId: string) {
    setCompletingRfq(prev => new Set(prev).add(rfqId))
    await fetch('/api/admin/complete-rfq', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ rfq_id: rfqId }),
    })
    setRfqs(prev => prev.filter(r => r.id !== rfqId))
    setCompletingRfq(prev => { const n = new Set(prev); n.delete(rfqId); return n })
  }

  // --- Auth gate ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
        <div className="bg-white border border-[#e8e8e2] rounded-2xl p-10 w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#1a1a18] mb-1">Admin</h1>
          <p className="text-sm text-[#8a8a82] mb-6">Enter password to continue.</p>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="border border-[#e8e8e2] rounded-lg px-4 py-2.5 text-sm text-[#1a1a18] outline-none focus:border-[#1a6b4a] transition-colors"
            />
            {authError && <p className="text-xs text-red-600">{authError}</p>}
            <button
              type="submit"
              className="bg-[#1a6b4a] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#155a3d] transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- Admin UI ---
  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <header className="bg-white border-b border-[#e8e8e2]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1a1a18]">
            <span className="text-[#1a6b4a]">just</span>spec — Admin
          </span>
          <button
            onClick={fetchRfqs}
            className="text-xs text-[#8a8a82] hover:text-[#1a1a18] transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-[#1a1a18]">Pending Responses</h1>
          <span className="text-xs text-[#8a8a82]">{rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && (
          <p className="text-sm text-[#8a8a82]">Loading…</p>
        )}

        {!loading && rfqs.length === 0 && (
          <div className="bg-white border border-[#e8e8e2] rounded-xl px-6 py-10 text-center">
            <p className="text-sm text-[#8a8a82]">No RFQs awaiting responses.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {rfqs.map(rfq => {
            const isExpanded = expandedRfqs.has(rfq.id)
            return (
              <div key={rfq.id} className="bg-white border border-[#e8e8e2] rounded-xl overflow-hidden">
                {/* RFQ header row */}
                <button
                  onClick={() => toggleRfq(rfq)}
                  className="w-full px-6 py-4 flex items-start justify-between text-left hover:bg-[#fafaf7] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a18] truncate pr-4">
                      {rfq.product_description ?? 'Untitled RFQ'}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-[#8a8a82]">
                        {new Date(rfq.created_at).toLocaleDateString()}
                      </span>
                      {rfq.quantities && rfq.quantities.length > 0 && (
                        <span className="text-xs text-[#8a8a82]">
                          Qty: {rfq.quantities.map(q => q.toLocaleString()).join(' / ')}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        {rfq.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#8a8a82] text-xs mt-0.5 shrink-0">
                    {isExpanded ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#e8e8e2] px-6 py-5">
                    {rfq.loadingQuotes && (
                      <p className="text-sm text-[#8a8a82] mb-4">Loading quotes…</p>
                    )}

                    {!rfq.loadingQuotes && (!rfq.quotes || rfq.quotes.length === 0) && (
                      <p className="text-sm text-[#8a8a82] mb-4">No quotes yet.</p>
                    )}

                    {rfq.quotes && rfq.quotes.length > 0 && (
                      <div className="flex flex-col gap-5 mb-6">
                        {rfq.quotes.map(quote => {
                          const parsed = parsedResults[quote.id]
                          const isParsing = parsingQuote.has(quote.id)
                          const parseError = parseErrors[quote.id]
                          const alreadyParsed = quote.status === 'response_received'

                          return (
                            <div key={quote.id} className="border border-[#e8e8e2] rounded-lg p-4">
                              {/* Quote header */}
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <span className="text-sm font-medium text-[#1a1a18]">
                                    {quote.supplier_name ?? 'Unknown Supplier'}
                                  </span>
                                  {quote.supplier_email && (
                                    <span className="text-xs text-[#8a8a82] ml-2">
                                      {quote.supplier_email}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  alreadyParsed
                                    ? 'bg-[#eaf3ef] text-[#1a6b4a]'
                                    : 'bg-[#f0f0ec] text-[#8a8a82]'
                                }`}>
                                  {quote.status}
                                </span>
                              </div>

                              {/* Already parsed — show existing data */}
                              {alreadyParsed && quote.price_tiers && (
                                <div className="mb-3 bg-[#fafaf7] rounded-lg px-3 py-2.5 text-xs text-[#1a1a18]">
                                  <span className="font-medium">Parsed: </span>
                                  {quote.price_tiers.map(t =>
                                    `${t.quantity.toLocaleString()} @ ${t.currency} ${t.unit_price}`
                                  ).join(' · ')}
                                  {quote.moq && <> · MOQ {quote.moq.toLocaleString()}</>}
                                  {quote.lead_time_days && <> · {quote.lead_time_days}d lead</>}
                                  {quote.payment_terms && <> · {quote.payment_terms}</>}
                                </div>
                              )}

                              {/* Inline parsed result from this session */}
                              {parsed && (
                                <div className="mb-3 bg-[#eaf3ef] border border-[#1a6b4a]/20 rounded-lg px-3 py-2.5 text-xs text-[#1a6b4a]">
                                  <span className="font-medium">Parsed: </span>
                                  {parsed.price_tiers.map(t =>
                                    `${t.quantity.toLocaleString()} @ $${t.unit_price}`
                                  ).join(' · ')}
                                  {parsed.moq && <> · MOQ {parsed.moq.toLocaleString()}</>}
                                  {parsed.lead_time_days && <> · {parsed.lead_time_days}d lead</>}
                                </div>
                              )}

                              {parseError && (
                                <p className="mb-3 text-xs text-red-600">{parseError}</p>
                              )}

                              {/* Email textarea + parse button */}
                              <textarea
                                rows={5}
                                value={emailInputs[quote.id] ?? ''}
                                onChange={e => setEmailInputs(prev => ({ ...prev, [quote.id]: e.target.value }))}
                                placeholder="Paste supplier email response here…"
                                className="w-full border border-[#e8e8e2] rounded-lg px-3 py-2 text-xs text-[#1a1a18] font-mono resize-y outline-none focus:border-[#1a6b4a] transition-colors"
                              />
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => parseResponse(quote.id)}
                                  disabled={isParsing || !(emailInputs[quote.id] ?? '').trim()}
                                  className="bg-[#1a6b4a] text-white rounded-lg px-4 py-1.5 text-xs font-medium hover:bg-[#155a3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {isParsing ? 'Parsing…' : 'Parse Response'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Mark Complete */}
                    <div className="flex justify-end pt-2 border-t border-[#e8e8e2]">
                      <button
                        onClick={() => markComplete(rfq.id)}
                        disabled={completingRfq.has(rfq.id)}
                        className="border border-[#1a6b4a] text-[#1a6b4a] rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#eaf3ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {completingRfq.has(rfq.id) ? 'Marking…' : 'Mark RFQ Complete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
