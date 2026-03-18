import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JustSpec — AI-Powered Sourcing Agent',
  description:
    'Submit a product spec. Get real supplier quotes in 48 hours. No cold emails, no sourcing agents.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable}`}>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased bg-[#fafaf7] text-[#1a1a18]">
        {children}
      </body>
    </html>
  )
}
