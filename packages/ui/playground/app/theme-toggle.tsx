'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    setTheme(document.documentElement.dataset.muiTheme === 'dark' ? 'dark' : 'light')
  }, [])

  const toggle = () => {
    const root = document.documentElement
    const next = root.dataset.muiTheme === 'dark' ? 'light' : 'dark'
    root.dataset.muiTheme = next
    try {
      localStorage.setItem('mui-theme', next)
    } catch {
      /* storage unavailable */
    }
    setTheme(next)
  }

  return (
    <button type="button" className="pg-theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
