import Navbar from '@/components/Navbar'
import SpecForm from '@/components/SpecForm'
import PricingSection from '@/components/PricingSection'
import SampleReportPreview from '@/components/SampleReportPreview'
import FadeUp from '@/components/FadeUp'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <WhatYouGetSection />
        <SocialProofSection />
        <PricingSection />
        <SpecFormSection />
        <Footer />
      </main>
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

const HERO_SUPPLIERS = [
  { name: 'Guangzhou AllMold Mfg.', moq: '10,000', fob: '$0.048', lead: '42 days', landed: '$0.063', best: true },
  { name: 'Shenzhen ProPack Ltd.', moq: '5,000', fob: '$0.061', lead: '35 days', landed: '$0.079', best: false },
  { name: 'Yiwu TopSource Co.', moq: '2,500', fob: '$0.074', lead: '28 days', landed: '$0.091', best: false },
]

function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left: copy — staggered CSS animations on load */}
        <div>
          <div
            className="inline-flex items-center gap-2 border border-[#e8e8e2] text-[#8a8a82] text-xs font-medium px-3 py-1.5 rounded-full mb-8 uppercase tracking-widest"
            style={{ animation: 'fadeSlideUp 0.5s ease 0ms both' }}
          >
            Supplier Quoting, Automated
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-[#1a1a18] mb-6"
            style={{ animation: 'fadeSlideUp 0.5s ease 80ms both' }}
          >
            Manufacturing quotes,{' '}
            <em className="not-italic italic text-[#1a6b4a]">without the hassle</em>
          </h1>

          <p
            className="text-lg text-[#8a8a82] leading-relaxed mb-8 max-w-lg"
            style={{ animation: 'fadeSlideUp 0.5s ease 160ms both' }}
          >
            Tell us what you need. We&apos;ll get you 5–10 verified supplier quotes with FOB
            pricing, landed costs, and lead times — in 48 hours, not 4 weeks.
          </p>

          <div style={{ animation: 'fadeSlideUp 0.5s ease 240ms both' }}>
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 bg-[#1a6b4a] text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-[#155a3d] transition-colors text-base"
            >
              Submit your first spec free →
            </a>
          </div>

          <div
            className="flex flex-wrap gap-x-8 gap-y-3 mt-8 pt-8 border-t border-[#e8e8e2]"
            style={{ animation: 'fadeSlideUp 0.5s ease 320ms both' }}
          >
            {[
              { value: '48 hrs', label: 'average turnaround' },
              { value: '5–10', label: 'verified quotes' },
              { value: '$0', label: 'first RFQ' },
            ].map(({ value, label }) => (
              <div key={value} className="flex items-baseline gap-1.5">
                <span className="text-[#1a1a18] font-bold text-sm tabular-nums">{value}</span>
                <span className="text-[#8a8a82] text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: mock RFQ card */}
        <div
          className="bg-white border border-[#e8e8e2] rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] overflow-hidden"
          style={{ animation: 'fadeSlideUp 0.6s ease 160ms both' }}
        >
          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#e8e8e2]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#8a8a82] font-medium mb-1 uppercase tracking-wider"
                   style={{ fontFamily: 'var(--font-dm-mono, ui-monospace)' }}>
                  RFQ #2841
                </p>
                <p className="font-semibold text-[#1a1a18] text-[15px] leading-snug">
                  Custom HDPE Supplement Jar — 120cc
                </p>
                <p className="text-sm text-[#8a8a82] mt-0.5">
                  White label · FDA compliant · Private label
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#eaf3ef] text-[#1a6b4a] text-xs font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a6b4a] opacity-50" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a6b4a]" />
                </span>
                7 quotes received
              </div>
            </div>
          </div>

          {/* Supplier table */}
          <div className="px-6 py-4 space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-xs text-[#8a8a82] font-medium pb-1 px-3">
              <span>Supplier</span>
              <span className="text-right">FOB/unit</span>
              <span className="text-right">Landed</span>
            </div>
            {HERO_SUPPLIERS.map((s) => (
              <div
                key={s.name}
                className={`grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-2.5 rounded-lg text-sm border ${
                  s.best
                    ? 'bg-[#eaf3ef] border-[#1a6b4a]/25'
                    : 'bg-[#fafaf7] border-[#e8e8e2]'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#1a1a18] truncate">{s.name}</p>
                  <p className="text-xs text-[#8a8a82]">MOQ {s.moq} · {s.lead}</p>
                </div>
                <span className="text-right text-[#8a8a82] tabular-nums">{s.fob}</span>
                <span className={`text-right font-bold tabular-nums ${s.best ? 'text-[#1a6b4a]' : 'text-[#1a1a18]'}`}>
                  {s.landed}
                </span>
              </div>
            ))}
          </div>

          {/* Card footer */}
          <div className="px-6 py-3.5 bg-[#fafaf7] border-t border-[#e8e8e2] flex items-center justify-between gap-4">
            <span className="text-xs text-[#8a8a82]">Quantities: 5,000 / 10,000 / 25,000</span>
            <span className="text-xs font-semibold text-[#1a6b4a] whitespace-nowrap">
              Best landed @ 50K: $0.082/unit
            </span>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Describe what you need',
    body: 'Tell us your product spec, quantities, and any requirements. Plain English is fine — no sourcing jargon needed.',
    time: '~2 minutes',
  },
  {
    num: '02',
    title: 'We contact suppliers',
    body: 'Our system identifies the best-fit manufacturers, sends professional bilingual RFQs, and follows up automatically.',
    time: '~48 hours',
  },
  {
    num: '03',
    title: 'Review your quotes',
    body: 'Get a ranked comparison report with FOB pricing, landed costs, lead times, MOQ, and compliance status. Ready to order.',
    time: 'Your decision',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white border-y border-[#e8e8e2] py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="mb-14">
            <p className="text-xs font-semibold text-[#1a6b4a] uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a18] leading-tight">
              Three steps. No Alibaba required.
            </h2>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <FadeUp key={step.num} delay={i * 100}>
              <div className="flex flex-col gap-5 h-full">
                <span
                  className="text-[4rem] font-bold text-[#e8e8e2] leading-none select-none"
                  style={{ fontFamily: 'var(--font-dm-mono, ui-monospace)' }}
                >
                  {step.num}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1a1a18] mb-2">{step.title}</h3>
                  <p className="text-[#8a8a82] leading-relaxed text-sm">{step.body}</p>
                </div>
                <div className="pt-4 border-t border-[#e8e8e2]">
                  <span
                    className="text-xs font-semibold text-[#1a6b4a] uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-dm-mono, ui-monospace)' }}
                  >
                    {step.time}
                  </span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── What You'll Get ──────────────────────────────────────────────────────────

function WhatYouGetSection() {
  return (
    <section id="sample-report" className="bg-[#f5f0e8] border-b border-[#e8e8e2] py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#1a6b4a] uppercase tracking-widest mb-3">
              What you&apos;ll get
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a18] leading-tight max-w-2xl">
              A structured comparison table ranking every supplier by landed cost — ready to act on in minutes.
            </h2>
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <div className="bg-white border border-[#e8e8e2] rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider">
                Sample Supplier Quotes — 5 responses
              </h3>
              <span className="text-xs text-[#8a8a82]">Ranked by landed cost</span>
            </div>
            <SampleReportPreview />
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

const TRUST_CARDS = [
  {
    stat: '1,000+ RFQs sent',
    body: 'Our team has sourced from 125+ Chinese manufacturers across packaging, supplements, food & beverage, and automotive.',
  },
  {
    stat: 'Real supplier relationships',
    body: 'Every quote comes from a verified manufacturer — not a trading company or middleman.',
  },
  {
    stat: 'Landed cost, not just FOB',
    body: 'Our reports include freight, duty, customs entry, drayage, and inspection — the real cost to your door.',
  },
]

function SocialProofSection() {
  return (
    <section className="bg-[#fafaf7] py-20 md:py-24 border-b border-[#e8e8e2]">
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a18] mb-12">
            Built by sourcing veterans
          </h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6">
          {TRUST_CARDS.map((card, i) => (
            <FadeUp key={card.stat} delay={i * 80}>
              <div className="bg-white border border-[#e8e8e2] rounded-xl p-6 h-full">
                <p className="font-semibold text-[#1a1a18] mb-3 text-base">{card.stat}</p>
                <p className="text-[#8a8a82] text-sm leading-relaxed">{card.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Spec Form ────────────────────────────────────────────────────────────────

function SpecFormSection() {
  return (
    <section id="get-started" className="bg-white border-t border-[#e8e8e2] py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <FadeUp>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-[#1a6b4a] uppercase tracking-widest mb-3">
              Get started
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a18] mb-4">
              What do you need manufactured?
            </h2>
            <p className="text-[#8a8a82] text-lg">
              Describe your product in plain English. We handle the rest.
            </p>
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <SpecForm />
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#e8e8e2] py-10 bg-[#fafaf7]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8a8a82]">
        <div className="font-bold text-base shrink-0">
          <span className="text-[#1a1a18]">just</span>
          <span className="text-[#1a6b4a]">spec</span>
        </div>
        <p className="text-center text-xs">
          © 2026 JustSpec ·{' '}
          <a href="https://justspec.co/terms" className="hover:text-[#1a1a18] transition-colors">
            Terms
          </a>
          {' · '}
          <a href="https://justspec.co/privacy" className="hover:text-[#1a1a18] transition-colors">
            Privacy
          </a>
          {' · '}
          Built by Diversified Product Solutions, LLC
        </p>
        <a
          href="https://justspec.co"
          className="text-[#1a6b4a] hover:underline font-medium text-sm shrink-0"
        >
          justspec.co
        </a>
      </div>
    </footer>
  )
}
