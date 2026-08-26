'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollHorizontal.module.css'

export interface ScrollHorizontalProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * Pinned section: the page keeps scrolling vertically while the content track
 * moves horizontally. The outer section is as tall as the track so each slide
 * gets roughly one viewport of scroll.
 */
export function ScrollHorizontal({ children, className, style, ...rest }: ScrollHorizontalProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const count = Array.isArray(children) ? Math.max(children.length, 1) : 1

  usePinProgress(ref)

  return (
    <div
      ref={ref}
      data-mui-scroll-horizontal=""
      className={cx(styles.section, className)}
      style={{ height: `${count * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={
            {
              width: `${count * 100}%`,
              '--mui-track-shift': `${((count - 1) / count) * 100}%`,
            } as CSSProperties
          }
        >
          {(Array.isArray(children) ? children : [children]).map((child, index) => (
            <div key={index} className={styles.slide}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
