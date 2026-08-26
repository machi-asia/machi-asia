'use client'

import { useEffect, useState } from 'react'

export const MOTION_CHANGE_EVENT = 'mui-motion-change'

export function MotionToggle() {
  const [forced, setForced] = useState(false)

  useEffect(() => {
    setForced(document.documentElement.hasAttribute('data-force-motion'))
    const sync = () => setForced(document.documentElement.hasAttribute('data-force-motion'))
    window.addEventListener(MOTION_CHANGE_EVENT, sync)
    return () => window.removeEventListener(MOTION_CHANGE_EVENT, sync)
  }, [])

  const toggle = () => {
    const root = document.documentElement
    const next = !root.hasAttribute('data-force-motion')
    if (next) {
      root.setAttribute('data-force-motion', '')
    } else {
      root.removeAttribute('data-force-motion')
    }
    try {
      localStorage.setItem('mui-force-motion', next ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
    setForced(next)
    window.dispatchEvent(new Event(MOTION_CHANGE_EVENT))
  }

  return (
    <button
      type="button"
      className="pg-theme-toggle"
      onClick={toggle}
      aria-pressed={forced}
      aria-label="Force animations"
      title={forced ? 'Animations forced ON (overriding OS reduced motion)' : 'Animations follow OS setting'}
    >
      {forced ? '▶' : '⏱'}
    </button>
  )
}
