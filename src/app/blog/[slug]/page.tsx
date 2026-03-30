import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BlogCTA from '@/components/BlogCTA'
import { getAllPosts, getPostBySlug, extractHeadings } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
import TocSidebar from './TocSidebar'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

const mdxComponents: MDXRemoteProps['components'] = {
  h2: ({ children, ...props }) => {
    const text = typeof children === 'string' ? children : ''
    const id = slugify(text)
    return (
      <h2 id={id} {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    const text = typeof children === 'string' ? children : ''
    const id = slugify(text)
    return (
      <h3 id={id} {...props}>
        {children}
      </h3>
    )
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  'china-sourcing': 'China Sourcing',
  'us-manufacturing': 'US Manufacturing',
  'sourcing-strategy': 'Sourcing Strategy',
  'managed-sourcing': 'Managed Sourcing',
  'tariffs-trade': 'Tariffs & Trade',
}

const CATEGORY_STYLES: Record<string, string> = {
  'china-sourcing': 'bg-[#eaf3ef] text-[#1a6b4a]',
  'us-manufacturing': 'bg-[#e8f0fb] text-[#1a4b8a]',
  'sourcing-strategy': 'bg-[#f0f0ec] text-[#5a5a52]',
  'managed-sourcing': 'bg-[#1a1a18] text-[#fafaf7]',
  'tariffs-trade': 'bg-[#fef3e2] text-[#8a5a1a]',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: `${post.title} | JustSpec`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const all = getAllPosts()
  const idx = all.findIndex((p) => p.slug === slug)
  const prev = idx < all.length - 1 ? all[idx + 1] : null
  const next = idx > 0 ? all[idx - 1] : null

  const related = all
    .filter((p) => p.category === post.category && p.slug !== slug)
    .slice(0, 3)

  const headings = extractHeadings(post.content)

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'JustSpec' },
    publisher: {
      '@type': 'Organization',
      name: 'JustSpec',
      url: 'https://justspec.co',
    },
    keywords: post.keywords.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#8a8a82] mb-8">
          <Link href="/blog" className="hover:text-[#1a6b4a] transition-colors">
            Guides
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[#1a1a18]">{post.title}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-12 xl:gap-16">
          {/* Main content */}
          <div className="min-w-0">
            {/* Article header */}
            <header className="mb-10">
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${CATEGORY_STYLES[post.category]}`}
              >
                {CATEGORY_LABELS[post.category]}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.1] tracking-tight text-[#1a1a18] mb-4">
                {post.title}
              </h1>
              <p className="text-[#8a8a82] text-sm">
                Published {formatDate(post.publishedAt)}
              </p>
            </header>

            {/* Mobile TOC */}
            {headings.length > 0 && (
              <div className="lg:hidden mb-8">
                <TocSidebar headings={headings} mobile />
              </div>
            )}

            {/* MDX body */}
            <div className="prose-article">
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>

            {/* CTA block */}
            <BlogCTA category={post.category} />

            {/* Related articles */}
            {related.length > 0 && (
              <section className="mt-12 pt-10 border-t border-[#e8e8e2]">
                <h2 className="text-lg font-semibold text-[#1a1a18] mb-6">Related articles</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      className="group border border-[#e8e8e2] rounded-xl p-5 hover:border-[#1a6b4a]/40 transition-colors"
                    >
                      <p className="text-sm font-semibold text-[#1a1a18] leading-snug group-hover:text-[#1a6b4a] transition-colors">
                        {r.title}
                      </p>
                      <p className="text-xs text-[#8a8a82] mt-1">{formatDate(r.publishedAt)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Prev / Next navigation */}
            {(prev || next) && (
              <nav className="mt-12 pt-8 border-t border-[#e8e8e2] flex gap-4 justify-between">
                {prev ? (
                  <Link
                    href={`/blog/${prev.slug}`}
                    className="group flex-1 border border-[#e8e8e2] rounded-xl p-5 hover:border-[#1a6b4a]/40 transition-colors"
                  >
                    <p className="text-xs text-[#8a8a82] mb-1">← Previous</p>
                    <p className="text-sm font-semibold text-[#1a1a18] group-hover:text-[#1a6b4a] transition-colors">
                      {prev.title}
                    </p>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                {next && (
                  <Link
                    href={`/blog/${next.slug}`}
                    className="group flex-1 border border-[#e8e8e2] rounded-xl p-5 hover:border-[#1a6b4a]/40 transition-colors text-right"
                  >
                    <p className="text-xs text-[#8a8a82] mb-1">Next →</p>
                    <p className="text-sm font-semibold text-[#1a1a18] group-hover:text-[#1a6b4a] transition-colors">
                      {next.title}
                    </p>
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Desktop TOC sidebar */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <TocSidebar headings={headings} />
            </aside>
          )}
        </div>
      </div>

      <footer className="border-t border-[#e8e8e2] mt-24 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#8a8a82]">
          <Link href="/" className="font-bold text-base">
            <span className="text-[#1a1a18]">just</span>
            <span className="text-[#1a6b4a]">spec</span>
          </Link>
          <p>© {new Date().getFullYear()} JustSpec. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
