'use client'

/**
 * Fires a single GA4 custom event on mount.
 * Use this to track events from server-rendered pages by rendering
 * <GtagEvent name="..." params={{ ... }} /> anywhere in the tree.
 *
 * Renders nothing — pure side-effect component.
 */

import { useEffect } from 'react'
import { trackEvent } from '@/lib/gtag'

interface Props {
  name: string
  params?: Record<string, unknown>
}

export default function GtagEvent({ name, params }: Props) {
  useEffect(() => {
    trackEvent(name, params)
    // Only fire once on mount — deps intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
