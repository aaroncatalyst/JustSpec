'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BlogPost, Category } from '@/lib/blog'

const CATEGORY_LABELS: Record<Category, string> = {
  'china-sourcing': 'China Sourcing',
  'us-manufacturing': 'US Manufacturing',
  'sourcing-strategy': 'Sourcing Strategy',
  'managed-sourcing': 'Managed Sourcing',
  'tariffs-trade': 'Tariffs & Trade',
}

const CATEGORY_STYLES: Record<Category, string> = {
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

export default function BlogIndexClient({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState<Category | 'all'>('all')

  const categories = Array.from(new Set(posts.map((p) => p.category))) as Category[]
  const filtered = active === 'all' ? posts : posts.filter((p) => p.category === active)

  return (
    <>
      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActive('all')}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors border ${
              active === 'all'
                ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                : 'border-[#e8e8e2] text-[#8a8a82] hover:border-[#1a1a18] hover:text-[#1a1a18]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors border ${
                active === cat
                  ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                  : 'border-[#e8e8e2] text-[#8a8a82] hover:border-[#1a1a18] hover:text-[#1a1a18]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Article grid */}
      {filtered.length === 0 ? (
        <p className="text-[#8a8a82] text-center py-24">No articles in this category yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-[#e8e8e2] rounded-xl p-6 hover:border-[#1a6b4a]/40 hover:shadow-[0_4px_20px_rgba(26,107,74,0.08)] transition-all"
            >
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${CATEGORY_STYLES[post.category]}`}
              >
                {CATEGORY_LABELS[post.category]}
              </span>
              <h2 className="text-base font-semibold text-[#1a1a18] leading-snug mb-2 group-hover:text-[#1a6b4a] transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-[#8a8a82] leading-relaxed mb-4 line-clamp-3">
                {post.description}
              </p>
              <p className="text-xs text-[#8a8a82]">{formatDate(post.publishedAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
