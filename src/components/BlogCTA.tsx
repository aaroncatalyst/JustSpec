import Link from 'next/link'
import type { Category } from '@/lib/blog'

const MANAGED_SOURCING_URL =
  process.env.NEXT_PUBLIC_MANAGED_SOURCING_URL ?? 'mailto:aaron@justspec.co'

interface CTAConfig {
  body: string
  buttons: Array<{
    label: string
    href: string
    primary?: boolean
  }>
}

const CTA_MAP: Record<Category, CTAConfig> = {
  'china-sourcing': {
    body: 'Skip the Alibaba guesswork. Submit your product spec and get quotes from verified manufacturers in 48 hours. Your first report is free.',
    buttons: [{ label: 'Get your free report', href: '/#get-started', primary: true }],
  },
  'us-manufacturing': {
    body: "We've indexed 3,000+ verified US manufacturers. Submit your spec and get matched with the right factories.",
    buttons: [{ label: 'Find US manufacturers', href: '/#get-started', primary: true }],
  },
  'sourcing-strategy': {
    body: 'Ready to source? Submit your spec and get a structured quote comparison from 10+ manufacturers.',
    buttons: [{ label: "Start sourcing — it's free", href: '/#get-started', primary: true }],
  },
  'managed-sourcing': {
    body: "Don't want to manage sourcing yourself? We handle everything — from finding manufacturers to warehousing and delivery.",
    buttons: [{ label: 'Talk to us', href: MANAGED_SOURCING_URL, primary: true }],
  },
  'tariffs-trade': {
    body: 'Not sure how tariffs affect your costs? Get quotes from both US and China manufacturers to compare real landed costs. Or use lgistics.ai to audit your current HTS classifications.',
    buttons: [
      { label: 'Compare US vs China quotes', href: '/#get-started', primary: true },
      { label: 'Try lgistics.ai', href: 'https://lgistics.ai', primary: false },
    ],
  },
}

export default function BlogCTA({ category }: { category: Category }) {
  const config = CTA_MAP[category]

  return (
    <div className="my-12 rounded-xl border-2 border-[#1a6b4a] bg-[#eaf3ef] px-7 py-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#1a6b4a] mb-3">
        Ready to source?
      </p>
      <p className="text-[#1a1a18] text-base leading-relaxed mb-5">{config.body}</p>
      <div className="flex flex-wrap gap-3">
        {config.buttons.map((btn) => (
          <Link
            key={btn.label}
            href={btn.href}
            className={
              btn.primary
                ? 'inline-flex items-center gap-2 bg-[#1a6b4a] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#155a3d] transition-colors'
                : 'inline-flex items-center gap-2 border border-[#1a6b4a] text-[#1a6b4a] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1a6b4a] hover:text-white transition-colors'
            }
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
