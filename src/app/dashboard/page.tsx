import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('id, status, product_description, created_at')
    .order('created_at', { ascending: false })

  const { message } = await searchParams

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Dashboard header */}
      <header className="bg-white border-b border-[#e8e8e2]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#1a1a18]">just</span>
            <span className="text-[#1a6b4a]">spec</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#8a8a82]">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-[#8a8a82] hover:text-[#1a1a18] transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {message && (
          <div className="mb-6 bg-[#eaf3ef] border border-[#1a6b4a]/20 text-[#1a6b4a] rounded-lg px-4 py-3 text-sm font-medium">
            {message}
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a18]">Your RFQs</h1>
            <p className="text-sm text-[#8a8a82] mt-1">
              Track your sourcing requests and view supplier quotes.
            </p>
          </div>
          <Link
            href="/#get-started"
            className="bg-[#1a6b4a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#155a3d] transition-colors"
          >
            + New RFQ
          </Link>
        </div>

        {(rfqs ?? []).length === 0 ? (
          <div className="bg-white border border-[#e8e8e2] rounded-2xl p-16 text-center">
            <div className="w-14 h-14 bg-[#eaf3ef] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#1a6b4a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a18] mb-2">No RFQs yet</h3>
            <p className="text-sm text-[#8a8a82] mb-6 max-w-sm mx-auto">
              Submit your first product spec and get real supplier quotes within 48 hours.
            </p>
            <Link
              href="/#get-started"
              className="inline-block bg-[#1a6b4a] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#155a3d] transition-colors"
            >
              Submit your first spec
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(rfqs ?? []).map((rfq) => (
              <Link
                key={rfq.id}
                href={`/dashboard/rfq/${rfq.id}`}
                className="bg-white border border-[#e8e8e2] rounded-xl px-6 py-4 flex items-center justify-between hover:border-[#1a6b4a]/40 transition-colors"
              >
                <div>
                  <p className="font-medium text-[#1a1a18] text-sm">
                    {rfq.product_description?.slice(0, 80) ?? 'Untitled RFQ'}
                  </p>
                  <p className="text-xs text-[#8a8a82] mt-0.5">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    rfq.status === 'completed'
                      ? 'bg-[#eaf3ef] text-[#1a6b4a]'
                      : rfq.status === 'processing'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-[#f0f0ec] text-[#8a8a82]'
                  }`}
                >
                  {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
