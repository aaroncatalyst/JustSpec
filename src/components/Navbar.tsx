'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#fafaf7]/90 backdrop-blur border-b border-[#e8e8e2]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-[#1a1a18]">just</span>
          <span className="text-[#1a6b4a]">spec</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[#8a8a82]">
          <Link href="#how-it-works" className="hover:text-[#1a1a18] transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="hover:text-[#1a1a18] transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-[#1a1a18] transition-colors">
            Sign in
          </Link>
          <Link
            href="#get-started"
            className="bg-[#1a6b4a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#155a3d] transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#8a8a82]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {menuOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#e8e8e2] bg-[#fafaf7] px-6 py-4 flex flex-col gap-4 text-sm">
          <Link href="#how-it-works" className="text-[#8a8a82] hover:text-[#1a1a18]" onClick={() => setMenuOpen(false)}>
            How it works
          </Link>
          <Link href="#pricing" className="text-[#8a8a82] hover:text-[#1a1a18]" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="/login" className="text-[#8a8a82] hover:text-[#1a1a18]" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <Link
            href="#get-started"
            className="bg-[#1a6b4a] text-white px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-[#155a3d] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Get started free
          </Link>
        </div>
      )}
    </nav>
  )
}
