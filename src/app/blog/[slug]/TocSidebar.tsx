'use client'

import { useState } from 'react'

interface Heading {
  id: string
  text: string
}

export default function TocSidebar({
  headings,
  mobile = false,
}: {
  headings: Heading[]
  mobile?: boolean
}) {
  const [open, setOpen] = useState(false)

  if (mobile) {
    return (
      <div className="border border-[#e8e8e2] rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-[#1a1a18] hover:bg-[#f0f0ec] transition-colors"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span>On this page</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`text-[#8a8a82] transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <nav className="px-5 pb-4 pt-1 border-t border-[#e8e8e2]">
            <ul className="space-y-2">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="text-sm text-[#8a8a82] hover:text-[#1a6b4a] transition-colors block py-0.5"
                    onClick={() => setOpen(false)}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    )
  }

  return (
    <div className="sticky top-24">
      <p className="text-xs uppercase tracking-widest text-[#8a8a82] font-medium mb-4">
        On this page
      </p>
      <nav>
        <ul className="space-y-2.5">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className="text-sm text-[#8a8a82] hover:text-[#1a6b4a] transition-colors block leading-snug"
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
