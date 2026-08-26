'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollCurtain.module.css'

export type ScrollCurtainDirection = 'up' | 'down' | 'left' | 'right'

export interface ScrollCurtainProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Pinned scroll distance in viewport-height multiples. Default 2. */
  length?: number
  /** Direction the curtain slides away towards. Default 'up'. */
  direction?: ScrollCurtainDirection
  /** Elements rendered on the sliding curtain itself (they wipe away with it). */
  curtain?: ReactNode
  curtainClassName?: string
  curtainStyle?: CSSProperties
}

/**
 * Pinned reveal: an opaque curtain covers the section and slides off in the
 * chosen direction as you scroll, while the content settles from a slight
 * zoom. Pass elements via `curtain` to place them on the cover itself.
 */
export function ScrollCurtain({
  children,
  length = 2,
  direction = 'up',
  curtain,
  curtainClassName,
  curtainStyle,
  className,
  style,
  ...rest
}: ScrollCurtainProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  usePinProgress(ref)

  return (
    <div
      ref={ref}
      data-mui-scroll-curtain=""
      data-mui-curtain-direction={direction}
      className={cx(styles.section, className)}
      style={{ height: `${Math.max(length, 1) * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        <div className={styles.content}>{children}</div>
        <div
          data-mui-curtain-cover=""
          className={cx(styles.curtain, styles[direction], curtainClassName)}
          style={curtainStyle}
          aria-hidden={!curtain}
        >
          {curtain}
        </div>
      </div>
    </div>
  )
}
