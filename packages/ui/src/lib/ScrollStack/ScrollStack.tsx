'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { clamp01, cx, useScrollLoop } from '../utils'
import styles from './ScrollStack.module.css'

export interface ScrollStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Height of each card in the deck. Defaults to '100vh'. */
  itemHeight?: string | number
  /** How far each covering card shrinks the ones beneath it (0-1 per level). Default 0.12. */
  scaleAmount?: number
  /** How much a card dims while being covered (0-1, applied once regardless of depth). Default 0.35. */
  dimAmount?: number
}

/**
 * Sticky card deck: every card pins to the top of the viewport and stays put
 * while the following sections slide over it. Each card is pulled back
 * (scaled down, lifted, dimmed) — and pushed further back as more cards pile
 * on top of it.
 */
export function ScrollStack({
  children,
  itemHeight = '100vh',
  scaleAmount = 0.12,
  dimAmount = 0.35,
  className,
  style,
  ...rest
}: ScrollStackProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useScrollLoop(ref, () => {
    const container = ref.current
    if (!container) return
    const layers = Array.from(container.children) as HTMLElement[]
    if (layers.length < 2) return
    const vh = window.innerHeight || document.documentElement.clientHeight || 1
    const span = Math.max(vh, 1)
    const arrivals = layers.map((layer) => clamp01((span - layer.getBoundingClientRect().top) / span))
    const MAX_DEPTH = 3
    for (let i = 0; i < layers.length - 1; i++) {
      const card = layers[i].firstElementChild as HTMLElement | null
      if (!card) continue
      let depth = 0
      for (let j = i + 1; j < layers.length; j++) depth += arrivals[j]
      card.style.setProperty('--mui-depth', Math.min(depth, MAX_DEPTH).toFixed(4))
      card.style.setProperty('--mui-cover', arrivals[i + 1].toFixed(4))
    }
  })

  return (
    <div
      ref={ref}
      data-mui-scroll-stack=""
      className={cx(styles.stack, className)}
      style={
        {
          '--mui-stack-scale': scaleAmount,
          '--mui-stack-dim': dimAmount,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              data-mui-stack-layer=""
              className={styles.layer}
              style={{ height: itemHeight }}
            >
              <div data-mui-stack-card="" className={styles.card}>
                {child}
              </div>
            </div>
          ))
        : children}
    </div>
  )
}
