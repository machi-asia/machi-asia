'use client'

import { useRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollZoom.module.css'

export type ScrollZoomMode = 'zoom-out' | 'zoom-in'

export interface ScrollZoomProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Pinned scroll distance in viewport-height multiples. Default 2. */
  length?: number
  /** `zoom-out` shrinks and fades the content away; `zoom-in` grows it into place. */
  mode?: ScrollZoomMode
}

/**
 * Pinned section whose content scales with scroll: it either recedes into the
 * distance (`zoom-out`) or rushes forward from small to full size (`zoom-in`).
 */
export function ScrollZoom({
  children,
  length = 2,
  mode = 'zoom-out',
  className,
  style,
  ...rest
}: ScrollZoomProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  usePinProgress(ref)

  return (
    <div
      ref={ref}
      data-mui-scroll-zoom=""
      data-mui-zoom-mode={mode}
      className={cx(styles.section, className)}
      style={{ height: `${Math.max(length, 1) * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        <div className={cx(styles.content, mode === 'zoom-in' ? styles.zoomIn : styles.zoomOut)}>
          {children}
        </div>
      </div>
    </div>
  )
}
