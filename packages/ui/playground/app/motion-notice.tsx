'use client'

import { useEffect, useState } from 'react'
import { MOTION_CHANGE_EVENT } from './motion-toggle'

export function MotionNotice() {
  const [reduced, setReduced] = useState(false)
  const [forced, setForced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setReduced(query.matches)
      setForced(document.documentElement.hasAttribute('data-force-motion'))
    }
    sync()
    query.addEventListener('change', sync)
    window.addEventListener(MOTION_CHANGE_EVENT, sync)
    return () => {
      query.removeEventListener('change', sync)
      window.removeEventListener(MOTION_CHANGE_EVENT, sync)
    }
  }, [])

  if (!reduced) return null

  const style: React.CSSProperties = {
    margin: '12px 20px 0',
    padding: '10px 14px',
    borderRadius: 'var(--mui-radius-md)',
    fontSize: '0.85rem',
    border: forced ? '1px solid var(--mui-success)' : '1px solid var(--mui-warning)',
    background: forced
      ? 'color-mix(in srgb, var(--mui-success) 12%, transparent)'
      : 'color-mix(in srgb, var(--mui-warning) 12%, transparent)',
  }

  if (forced) {
    return (
      <div role="status" style={style}>
        Your OS has <strong>reduced motion</strong> enabled, but the playground is currently{' '}
        <strong>forcing animations</strong> (the ▶ button in the header). Turn it off to respect
        the OS setting again.
      </div>
    )
  }

  return (
    <div role="status" style={style}>
      Your OS has <strong>reduced motion</strong> enabled, so this library intentionally renders
      animations at ~1ms. Click the ⏱ button in the header to force animations on anyway, or
      disable “Animation effects” suppression in Windows settings (Settings → Accessibility →
      Visual effects) to change it system-wide.
    </div>
  )
}
