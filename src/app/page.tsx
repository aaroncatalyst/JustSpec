import Navbar from '@/components/Navbar'
import SpecForm from '@/components/SpecForm'
import PricingSection from '@/components/PricingSection'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <PricingSection />
        <SpecFormSection />
        <Footer />
      </main>
    </>
  )
}

function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#eaf3ef] text-[#1a6b4a] text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
            AI Sourcing Agent
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-[#1a1a18] mb-5">
            Real supplier quotes.<br />
            <span className="text-[#1a6b4a]">In 48 hours.</span>
          </h1>
          <p className="text-lg text-[#8a8a82] leading-relaxed mb-8 max-w-md">
            Submit a product spec. Our AI agent finds qualified manufacturers,
            sends RFQs, and delivers a structured comparison report—no cold
            emails, no sourcing agencies.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#get-started"
              className="bg-[#1a6b4a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#155a3d] transition-colors text-center"
            >
              Get your first quote free
            </a>
            <a
              href="#how-it-works"
              className="border border-[#e8e8e2] text-[#1a1a18] px-6 py-3 rounded-lg font-medium hover:bg-[#e8e8e2] transition-colors text-center"
            >
              See how it works
            </a>
          </div>
          <p className="text-xs text-[#8a8a82] mt-4">
            No credit card required · 1 free RFQ included
          </p>
        </div>

        {/* Right: demo card */}
        <div className="bg-white border border-[#e8e8e2] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8a8a82] uppercase tracking-wider">
              Sample RFQ Report
            </span>
            <span className="bg-[#eaf3ef] text-[#1a6b4a] text-xs font-semibold px-2 py-1 rounded-full">
              Completed
            </span>
          </div>
          <p className="font-semibold text-[#1a1a18] mb-1">
            500ml BPA-free water bottle
          </p>
          <p className="text-sm text-[#8a8a82] mb-5">
            Stainless steel · FDA compliant · Qty: 1,000 / 5,000 / 10,000
          </p>
          <div className="space-y-3">
            {[
              { name: 'Shenzhen MetalWorks Co.', moq: '1,000', price: '$3.20', lead: '35 days' },
              { name: 'Yiwu ProSource Ltd.', moq: '2,000', price: '$2.85', lead: '42 days' },
              { name: 'Guangzhou AllGoods Mfg.', moq: '500', price: '$3.75', lead: '28 days' },
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between bg-[#fafaf7] border border-[#e8e8e2] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#1a1a18]">{s.name}</p>
                  <p className="text-xs text-[#8a8a82]">MOQ {s.moq} · {s.lead}</p>
                </div>
                <span className="text-[#1a6b4a] font-bold">{s.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8a8a82] text-center mt-4">
            3 quotes received · 48h turnaround
          </p>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Describe your product',
      body: 'Fill out our spec form with material, quantities, compliance needs, and any reference links or files.',
    },
    {
      num: '02',
      title: 'AI finds & contacts suppliers',
      body: 'Our agent identifies qualified manufacturers, personalizes outreach emails, and sends RFQs on your behalf.',
    },
    {
      num: '03',
      title: 'Get a structured report',
      body: 'Receive a clean comparison of supplier quotes—pricing tiers, MOQs, lead times, and landed cost estimates.',
    },
  ]

  return (
    <section id="how-it-works" className="bg-white border-y border-[#e8e8e2] py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#1a1a18] mb-3">How it works</h2>
          <p className="text-[#8a8a82] max-w-md mx-auto">
            From spec to quotes in three steps, entirely handled by our AI agent.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col gap-4">
              <span className="text-4xl font-bold text-[#e8e8e2]">{step.num}</span>
              <h3 className="text-lg font-semibold text-[#1a1a18]">{step.title}</h3>
              <p className="text-[#8a8a82] leading-relaxed text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


function SpecFormSection() {
  return (
    <section id="get-started" className="bg-white border-t border-[#e8e8e2] py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a1a18] mb-3">Submit your spec</h2>
          <p className="text-[#8a8a82]">
            Fill in as much detail as you can. More context = better supplier matches.
          </p>
        </div>
        <SpecForm />
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[#e8e8e2] py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8a8a82]">
        <div className="font-bold text-base">
          <span className="text-[#1a1a18]">just</span>
          <span className="text-[#1a6b4a]">spec</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#1a1a18] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#1a1a18] transition-colors">Terms</a>
          <a href="mailto:hello@justspec.com" className="hover:text-[#1a1a18] transition-colors">
            Contact
          </a>
        </div>
        <p>© {new Date().getFullYear()} JustSpec. All rights reserved.</p>
      </div>
    </footer>
  )
}
