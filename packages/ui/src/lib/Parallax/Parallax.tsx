'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, useScrollProgress } from '../utils'
import styles from './Parallax.module.css'

export interface ParallaxProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Total drift across the wrapper's time on screen, as a fraction of the
   * viewport height. Negative moves against the scroll (background recedes),
   * positive moves with it. 0 disables. Typical range: -0.6 to 0.6.
   * Default -0.2.
   */
  speed?: number
}

export function Parallax({ children, speed = -0.2, className, style, ...rest }: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  useScrollProgress(ref)

  return (
    <div
      ref={ref}
      data-mui-parallax=""
      className={cx(styles.parallax, className)}
      style={{ '--mui-parallax-speed': speed, ...style } as CSSProperties}
      {...rest}
    >
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
