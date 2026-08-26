'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollDepth.module.css'

/** Fraction of the pin each layer spends flying towards the viewer. */
const FLIGHT = 0.45

export interface ScrollDepthProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Pinned scroll distance in viewport-height multiples. Defaults to one per two layers (min 2). */
  length?: number
}

/**
 * Pinned 3D tunnel: stacked layers fly from deep in the background towards
 * the viewer one after another as you scroll.
 */
export function ScrollDepth({ children, length, className, style, ...rest }: ScrollDepthProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  usePinProgress(ref)

  const layers = Array.isArray(children) ? children : [children]
  const count = Math.max(layers.length, 1)
  const pinLength = length ?? Math.max(2, Math.ceil(count / 2))

  return (
    <div
      ref={ref}
      data-mui-scroll-depth=""
      className={cx(styles.section, className)}
      style={{ height: `${Math.max(pinLength, 1) * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        {layers.map((child, index) => (
          <div
            key={index}
            className={styles.layer}
            style={
              {
                zIndex: index + 1,
                '--mui-layer-start':
                  count > 1 ? ((index / (count - 1)) * (1 - FLIGHT)).toFixed(4) : '0',
              } as CSSProperties
            }
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
