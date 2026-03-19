'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const [compliance, setCompliance] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<string[]>([''])
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noCredits, setNoCredits] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

  // Step 1: validate auth + credits, then show confirmation dialog
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setNoCredits(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signup?message=Create+an+account+to+submit+your+spec')
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('rfq_credits')
      .eq('id', user.id)
      .single()

    if (!userData || userData.rfq_credits <= 0) {
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

    const formData = new FormData(formRef.current!)

    try {
      // Upload files to Storage
      const fileUrls: string[] = []
      for (const file of files) {
        const path = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('rfq-attachments')
          .upload(path, file)
        if (uploadError) throw uploadError
        fileUrls.push(path)
      }

      const quantityValues = quantities
        .map((q) => parseInt(q))
        .filter((q) => !isNaN(q) && q > 0)

      const links = referenceLinks.filter((l) => l.trim() !== '')

      const { data: rfqData, error: insertError } = await supabase
        .from('rfqs')
        .insert({
          user_id: user.id,
          product_description: formData.get('product_description') as string,
          product_category: (formData.get('product_category') as string) || null,
          material: (formData.get('material') as string) || null,
          quantities: quantityValues.length > 0 ? quantityValues : null,
          destination_country:
            (formData.get('destination_country') as string) || 'US',
          supplier_region: (formData.get('supplier_region') as string) || null,
          compliance: compliance.length > 0 ? compliance : null,
          reference_links: links.length > 0 ? links : null,
          additional_notes:
            (formData.get('additional_notes') as string) || null,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          status: 'draft',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      const rfqId = rfqData.id

      // Deduct credit
      await supabase.rpc('decrement_credits', { uid: user.id })

      // Fire-and-forget pipeline trigger
      fetch('/api/trigger-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfq_id: rfqId }),
      }).catch(err => console.error('Pipeline trigger error:', err))

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
            <h2 className="text-base font-semibold text-[#1a1a18] mb-2">Ready to submit?</h2>
            <p className="text-sm text-[#8a8a82] mb-6 leading-relaxed">
              This will use <span className="font-semibold text-[#1a1a18]">1 RFQ credit</span> and immediately start finding suppliers and sending outreach emails.
            </p>
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
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-8">
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

        {/* Destination + Supplier region */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1a1a18]">
              Destination country
            </label>
            <input
              type="text"
              name="destination_country"
              defaultValue="US"
              placeholder="US"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1a1a18]">
              Preferred supplier region
            </label>
            <input
              type="text"
              name="supplier_region"
              placeholder="e.g. China, Southeast Asia, Europe..."
              className={INPUT_CLASS}
            />
          </div>
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
        <p className="text-xs text-[#8a8a82] text-center -mt-4">
          Your first RFQ is free. No credit card required.
        </p>
      </form>
    </>
  )
}
