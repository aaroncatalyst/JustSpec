'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fireConversion, trackEvent } from '@/lib/gtag'
import { PENDING_RFQ_KEY, getEligibility, insertRfqAndStart, type RfqSpec } from '@/lib/rfq'
import Link from 'next/link'

const CATEGORIES = [
  'Electronics',
  'Packaging',
  'Apparel & Textiles',
  'Plastics & Rubber',
  'Metal Parts',
  'Food & Beverage',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Outdoors',
  'Other',
]

const COMPLIANCE_OPTIONS = [
  { id: 'fda', label: 'FDA' },
  { id: 'ce', label: 'CE' },
  { id: 'rohs', label: 'RoHS' },
  { id: 'reach', label: 'REACH' },
  { id: 'ul', label: 'UL' },
  { id: 'bsci', label: 'BSCI' },
  { id: 'iso9001', label: 'ISO 9001' },
]

const INPUT_CLASS =
  'border border-[#e8e8e2] rounded-lg px-4 py-3 text-sm text-[#1a1a18] placeholder:text-[#8a8a82] focus:outline-none focus:ring-2 focus:ring-[#1a6b4a]/30 focus:border-[#1a6b4a] bg-white'

export default function SpecForm() {
  const router = useRouter()
  const [quantities, setQuantities] = useState<string[]>(['', '', ''])
  const [supplierRegion, setSupplierRegion] = useState<string>('Both')
  const [compliance, setCompliance] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<string[]>([''])
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noCredits, setNoCredits] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  // True when this will be the user's first (free) RFQ — no credit card needed
  const [isFreeEligible, setIsFreeEligible] = useState(false)
  // Auth state: null = unknown (still checking), true/false once resolved
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  // Set once we've emailed a magic link to a logged-out visitor
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Resolve auth state on mount so we know whether to ask for an email
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
  }, [])

  // Collect the current form values into a serializable spec (no File objects)
  const collectSpec = (isFree: boolean): RfqSpec => {
    const formData = new FormData(formRef.current!)
    const quantityValues = quantities
      .map((q) => parseInt(q))
      .filter((q) => !isNaN(q) && q > 0)
    const links = referenceLinks.filter((l) => l.trim() !== '')
    return {
      product_description: (formData.get('product_description') as string) || '',
      product_category: (formData.get('product_category') as string) || null,
      material: (formData.get('material') as string) || null,
      quantities: quantityValues.length > 0 ? quantityValues : null,
      destination_country: (formData.get('destination_country') as string) || 'US',
      supplier_region: isFree ? 'China' : supplierRegion,
      compliance: compliance.length > 0 ? compliance : null,
      reference_links: links.length > 0 ? links : null,
      additional_notes: (formData.get('additional_notes') as string) || null,
      file_urls: null,
      is_free: isFree,
    }
  }

  const toggleCompliance = (id: string) => {
    setCompliance((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const addReferenceLink = () => setReferenceLinks((prev) => [...prev, ''])
  const removeReferenceLink = (i: number) =>
    setReferenceLinks((prev) => prev.filter((_, idx) => idx !== i))
  const updateReferenceLink = (i: number, value: string) =>
    setReferenceLinks((prev) => prev.map((l, idx) => (idx === i ? value : l)))

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    setFiles((prev) => [...prev, ...Array.from(newFiles)])
  }
  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  // Step 1: validate auth + credits/free eligibility, then show confirmation dialog
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setNoCredits(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Logged-out visitor: DON'T bounce them to signup and lose their spec.
    // Save the spec locally, email a magic link, and finish on /submit-pending
    // when they click it. The link click doubles as email verification.
    if (!user) {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        setError('Enter your email so we can send your free report.')
        return
      }
      setLoading(true)
      try {
        // Free by default for a first-time visitor; eligibility is re-checked
        // server-side on return (existing users with no credits are handled there).
        const spec = collectSpec(true)
        window.localStorage.setItem(PENDING_RFQ_KEY, JSON.stringify(spec))
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/submit-pending')}`
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: { emailRedirectTo },
        })
        if (otpError) throw otpError
        trackEvent('rfq_email_submitted', {})
        setOtpSentTo(trimmedEmail)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send your link. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Logged-in: check eligibility, then show the confirmation dialog
    const { freeEligible, credits } = await getEligibility(supabase, user.id)
    setIsFreeEligible(freeEligible)
    if (!freeEligible && credits <= 0) {
      setNoCredits(true)
      return
    }

    setConfirmOpen(true)
  }

  // Step 2: user confirmed — do the real work
  const handleConfirm = async () => {
    setConfirmOpen(false)
    setConfirmLoading(true)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); setConfirmLoading(false); return }

    try {
      // Upload any attachments to Storage first (logged-in path only)
      const fileUrls: string[] = []
      for (const file of files) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('rfq-attachments')
          .upload(path, file)
        if (uploadError) throw uploadError
        fileUrls.push(path)
      }

      const spec = collectSpec(isFreeEligible)
      spec.file_urls = fileUrls.length > 0 ? fileUrls : null

      const rfqId = await insertRfqAndStart(supabase, user.id, spec)

      // Conversion tracking — fire before navigation so the beacon has time to send
      fireConversion(isFreeEligible ? 0 : 39.0)
      trackEvent('spec_submitted', { is_free: isFreeEligible, source: 'form' })

      // Redirect to the RFQ detail page where progress polling will show
      router.push(`/dashboard/rfq/${rfqId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
      setConfirmLoading(false)
    }
  }

  return (
    <>
      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {isFreeEligible ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#1a6b4a] bg-[#eaf3ef] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Free report
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[#1a1a18] mb-2">
                  Ready to get your free report?
                </h2>
                <p className="text-sm text-[#8a8a82] mb-6 leading-relaxed">
                  We&apos;ll search up to <span className="font-semibold text-[#1a1a18]">5 manufacturers</span> and email you a comparison report within 48 hours.{' '}
                  <span className="text-[#1a6b4a] font-medium">No credit card needed.</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-[#1a1a18] mb-2">Ready to submit?</h2>
                <p className="text-sm text-[#8a8a82] mb-6 leading-relaxed">
                  This will use <span className="font-semibold text-[#1a1a18]">1 RFQ credit</span> and immediately start finding{' '}
                  {supplierRegion === 'US'
                    ? 'up to 15 US manufacturers'
                    : supplierRegion === 'China'
                    ? 'up to 15 Chinese manufacturers'
                    : 'up to 15 manufacturers from the US and China'}{' '}
                  and sending outreach emails.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#e8e8e2] text-sm font-medium text-[#1a1a18] hover:bg-[#f8f8f4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-[#1a6b4a] text-sm font-semibold text-white hover:bg-[#155a3d] transition-colors"
              >
                {isFreeEligible ? 'Get my free report' : 'Yes, submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic-link sent — the visitor's spec is saved and will submit on click */}
      {otpSentTo && (
        <div className="bg-white border border-[#1a6b4a]/20 rounded-2xl p-8 text-center">
          <div className="bg-[#eaf3ef] text-[#1a6b4a] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a1a18] mb-2">Check your email</h2>
          <p className="text-sm text-[#8a8a82] leading-relaxed">
            We saved your spec and sent a link to{' '}
            <span className="font-semibold text-[#1a1a18]">{otpSentTo}</span>. Click it and your
            free report starts instantly — no password needed.
          </p>
          <button
            type="button"
            onClick={() => setOtpSentTo(null)}
            className="text-sm text-[#1a6b4a] font-medium hover:underline mt-6"
          >
            ← Edit your spec
          </button>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`flex flex-col gap-8 ${otpSentTo ? 'hidden' : ''}`}
      >
        {/* Free tier banner — always shown, sets expectations before submit */}
        <div className="flex items-center gap-3 bg-[#eaf3ef] border border-[#1a6b4a]/20 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-[#1a6b4a] shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L7 8.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-[#1a6b4a] font-medium">
            Your first report is free — no credit card required
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* No credits banner */}
        {noCredits && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>No RFQ credits remaining.</span>
            <Link
              href="/#pricing"
              className="shrink-0 font-semibold underline hover:no-underline"
            >
              Upgrade your plan →
            </Link>
          </div>
        )}

        {/* Product description */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Product description <span className="text-[#1a6b4a]">*</span>
          </label>
          <textarea
            name="product_description"
            rows={4}
            required
            placeholder="Describe your product in detail. Include dimensions, intended use, target user, and any design requirements..."
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        {/* Category + Material */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1a1a18]">
              Product category
            </label>
            <select
              name="product_category"
              className={`${INPUT_CLASS} appearance-none cursor-pointer`}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1a1a18]">
              Primary material
            </label>
            <input
              type="text"
              name="material"
              placeholder="e.g. 304 stainless steel, HDPE, cotton..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Quantities */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Order quantities (request pricing for up to 3 tiers)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {quantities.map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-xs text-[#8a8a82]">Tier {i + 1}</span>
                <input
                  type="number"
                  min={1}
                  placeholder={i === 0 ? '1,000' : i === 1 ? '5,000' : '10,000'}
                  value={q}
                  onChange={(e) => {
                    const next = [...quantities]
                    next[i] = e.target.value
                    setQuantities(next)
                  }}
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Destination country */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Destination country
          </label>
          <input
            type="text"
            name="destination_country"
            defaultValue="US"
            placeholder="US"
            className={`${INPUT_CLASS} max-w-xs`}
          />
        </div>

        {/* Compliance checkboxes */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Compliance &amp; certifications required
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleCompliance(id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  compliance.includes(id)
                    ? 'bg-[#1a6b4a] border-[#1a6b4a] text-white'
                    : 'bg-white border-[#e8e8e2] text-[#8a8a82] hover:border-[#1a6b4a] hover:text-[#1a6b4a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference links — repeatable URL inputs */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Reference links{' '}
            <span className="text-[#8a8a82] font-normal">(optional)</span>
          </label>
          <p className="text-xs text-[#8a8a82] -mt-1">
            Amazon listings, Alibaba products, competitor sites, inspiration images
          </p>
          <div className="flex flex-col gap-2">
            {referenceLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateReferenceLink(i, e.target.value)}
                  placeholder="https://www.amazon.com/..."
                  className={`${INPUT_CLASS} flex-1`}
                />
                {referenceLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReferenceLink(i)}
                    className="px-3 py-2 text-[#8a8a82] hover:text-red-500 border border-[#e8e8e2] rounded-lg transition-colors text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addReferenceLink}
            className="self-start text-sm text-[#1a6b4a] hover:underline font-medium"
          >
            + Add another link
          </button>
        </div>

        {/* File upload — drag & drop */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Attachments <span className="text-[#8a8a82] font-normal">(optional)</span>
          </label>
          {isLoggedIn !== true && (
            <p className="text-xs text-[#8a8a82] -mt-1">
              You can add files to your report after you click the email link.
            </p>
          )}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#1a6b4a] bg-[#1a6b4a]/5'
                : 'border-[#e8e8e2] hover:border-[#1a6b4a]/50'
            }`}
          >
            <svg
              className="w-8 h-8 text-[#8a8a82] mx-auto mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-[#8a8a82]">
              Drag &amp; drop files, or{' '}
              <span className="text-[#1a6b4a] font-medium underline">browse</span>
            </p>
            <p className="text-xs text-[#8a8a82] mt-1">PDF, PNG, JPG, DXF up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.dxf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="flex flex-col gap-1">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm text-[#1a1a18] bg-[#f8f8f4] rounded-lg px-3 py-2"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-3 text-[#8a8a82] hover:text-red-500 shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Additional notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Additional notes <span className="text-[#8a8a82] font-normal">(optional)</span>
          </label>
          <textarea
            name="additional_notes"
            rows={3}
            placeholder="Packaging requirements, branding preferences, sample needs, timeline constraints..."
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        {/* Supplier region */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1a1a18]">
            Where should we look for manufacturers?
          </label>
          <select
            name="supplier_region"
            value={isFreeEligible ? 'China' : supplierRegion}
            onChange={(e) => setSupplierRegion(e.target.value)}
            disabled={isFreeEligible}
            className={`${INPUT_CLASS} appearance-none cursor-pointer ${isFreeEligible ? 'opacity-50 cursor-not-allowed bg-[#f8f8f4]' : ''}`}
          >
            <option value="Both">US &amp; China (recommended)</option>
            <option value="US">United States only</option>
            <option value="China">China only</option>
          </select>
          <p className="text-xs text-[#8a8a82]">
            {isFreeEligible
              ? 'Free reports source from China manufacturers. Upgrade to search US suppliers too.'
              : 'Paid reports include up to 15 suppliers from your selected region.'}
          </p>
        </div>

        {/* Email — only asked of logged-out visitors, so a first submit needs
            no separate signup page. We send a one-click magic link. */}
        {isLoggedIn !== true && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1a1a18]">
              Your email <span className="text-[#1a6b4a]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className={INPUT_CLASS}
            />
            <p className="text-xs text-[#8a8a82]">
              We&apos;ll email your free report here. No password to create — just click the link we send.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || confirmLoading}
          className="bg-[#1a6b4a] text-white py-4 rounded-lg font-semibold text-sm hover:bg-[#155a3d] transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading || confirmLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting…
            </>
          ) : (
            'Submit spec & find suppliers'
          )}
        </button>
      </form>
    </>
  )
}
