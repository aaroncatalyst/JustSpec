import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

// Google tag IDs — set in Vercel env vars, undefined in development
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

// Primary measurement ID drives the gtag.js script src
// (GA4 preferred; fall back to Ads-only if GA4 not configured)
const PRIMARY_ID = GA4_ID ?? ADS_ID
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  // Canonical host. Makes all canonical/OG URLs absolute + www, which resolves
  // the GSC "Duplicate without user-selected canonical" flag.
  metadataBase: new URL('https://www.justspec.co'),
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
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        <meta name="google-site-verification" content="y3k3ecFf4e7chl-rrX_SNoEsG5YnYghGegPk2rFcvOg" />
        {IS_PRODUCTION && PRIMARY_ID && (
          <>
            {/* Load the gtag.js library — single script covers both GA4 and Google Ads */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${PRIMARY_ID}`}
              strategy="afterInteractive"
            />
            {/* Initialise dataLayer and config each property */}
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ''}
                ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ''}
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased bg-[#fafaf7] text-[#1a1a18]">
        {children}
      </body>
    </html>
  )
}
