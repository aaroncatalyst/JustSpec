import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getAllPosts } from '@/lib/blog'
import BlogIndexClient from './BlogIndexClient'

export const metadata: Metadata = {
  title: 'Sourcing Guides & Resources | JustSpec',
  description:
    'Practical guides on China sourcing, US manufacturing, tariffs, and import strategy — from the team at JustSpec.',
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest text-[#8a8a82] font-medium mb-3">
            Resources
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1a1a18] mb-4">
            Sourcing Guides
          </h1>
          <p className="text-lg text-[#8a8a82] max-w-xl leading-relaxed">
            Practical guides on China sourcing, US manufacturing, tariffs, and supply chain
            strategy.
          </p>
        </div>

        <BlogIndexClient posts={posts} />
      </main>

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
