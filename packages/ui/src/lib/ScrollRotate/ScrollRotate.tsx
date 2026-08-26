'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollRotate.module.css'

export interface ScrollRotateProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Pinned scroll distance in viewport-height multiples. Default 2. */
  length?: number
  /** Total rotation in degrees across the pin (negative spins the other way). Default 180. */
  angle?: number
}

/**
 * Pinned section whose content rotates through `angle` degrees as you scroll.
 */
export function ScrollRotate({
  children,
  length = 2,
  angle = 180,
  className,
  style,
  ...rest
}: ScrollRotateProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  usePinProgress(ref)

  return (
    <div
      ref={ref}
      data-mui-scroll-rotate=""
      className={cx(styles.section, className)}
      style={{ height: `${Math.max(length, 1) * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        <div
          className={styles.content}
          style={{ '--mui-rotate-angle': `${angle}deg` } as CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
