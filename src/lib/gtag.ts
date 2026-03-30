/**
 * Google Analytics 4 + Google Ads gtag helpers.
 *
 * All functions are no-ops when:
 *   - running server-side (typeof window === 'undefined')
 *   - the relevant env vars are not set
 *   - gtag hasn't loaded yet (graceful degradation)
 *
 * Env vars (set in .env.local / Vercel):
 *   NEXT_PUBLIC_GA4_ID                    e.g. G-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_ID             e.g. AW-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL  e.g. AbCdEfGhIj
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
export const ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag(...args)
}

/**
 * Fire a Google Ads conversion event.
 * Call after a user completes a meaningful action (spec submission).
 *
 * @param value  Expected revenue in USD (0 for free tier, 39 for paid report)
 */
export function fireConversion(value: number = 39.0) {
  if (!ADS_ID || !ADS_CONVERSION_LABEL) return
  gtag('event', 'conversion', {
    send_to: `${ADS_ID}/${ADS_CONVERSION_LABEL}`,
    value,
    currency: 'USD',
  })
}

/**
 * Fire an arbitrary GA4 custom event.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  gtag('event', eventName, params ?? {})
}
