'use client'

import { useRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { clamp01, cx, useScrollLoop } from '../utils'
import styles from './ScrollReveal.module.css'

export type ScrollRevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'blur'
  | 'wipe'
  | 'rotate'
  | 'flip'

/** Fraction of the viewport height the section travels while revealing. */
const ENTER_WINDOW = 0.45

export interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: ScrollRevealVariant
}

/**
 * Scroll-scrubbed section entrance: every variant interpolates directly with
 * scroll position (and reverses when scrolling back). The reveal completes
 * after the section has travelled ENTER_WINDOW viewport heights, or as soon
 * as it is fully inside the viewport — whichever comes first.
 */
export function ScrollReveal({ children, variant = 'fade-up', className, style, ...rest }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useScrollLoop(ref, () => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight || 1
    const entered = Math.max(vh - rect.top, 0)
    let progress = entered / (vh * ENTER_WINDOW)
    if (rect.height > 0) progress = Math.max(progress, entered / rect.height)
    el.style.setProperty('--mui-progress', clamp01(progress).toFixed(4))
  })

  return (
    <div
      ref={ref}
      data-mui-scroll-reveal=""
      data-mui-reveal-variant={variant}
      className={cx(styles.reveal, styles[variant], className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  )
}
