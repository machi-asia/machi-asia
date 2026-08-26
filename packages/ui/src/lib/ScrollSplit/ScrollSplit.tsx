'use client'

import { useRef } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cx, usePinProgress } from '../utils'
import styles from './ScrollSplit.module.css'

export type ScrollSplitDirection = 'horizontal' | 'vertical'

export interface ScrollSplitProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Pinned scroll distance in viewport-height multiples. Default 2. */
  length?: number
  /** Axis the two panels part along. Default 'horizontal'. */
  direction?: ScrollSplitDirection
  /** Elements rendered on the first (left/top) door panel. */
  panelA?: ReactNode
  /** Elements rendered on the second (right/bottom) door panel. */
  panelB?: ReactNode
  panelClassName?: string
  panelStyle?: CSSProperties
}

/**
 * Pinned reveal: two opaque panels part like elevator doors as you scroll,
 * uncovering the content beneath. Pass elements via `panelA` / `panelB` to
 * place them on the doors themselves.
 */
export function ScrollSplit({
  children,
  length = 2,
  direction = 'horizontal',
  panelA,
  panelB,
  panelClassName,
  panelStyle,
  className,
  style,
  ...rest
}: ScrollSplitProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  usePinProgress(ref)

  const hasPanelContent = Boolean(panelA || panelB)

  return (
    <div
      ref={ref}
      data-mui-scroll-split=""
      data-mui-split-direction={direction}
      className={cx(styles.section, styles[direction], className)}
      style={{ height: `${Math.max(length, 1) * 100}vh`, ...style }}
      {...rest}
    >
      <div className={styles.viewport}>
        <div className={styles.content}>{children}</div>
        <div className={styles.panels} aria-hidden={hasPanelContent ? undefined : true}>
          <div data-mui-panel-a="" className={cx(styles.panel, styles.panelA, panelClassName)} style={panelStyle}>
            {panelA}
          </div>
          <div data-mui-panel-b="" className={cx(styles.panel, styles.panelB, panelClassName)} style={panelStyle}>
            {panelB}
          </div>
        </div>
      </div>
    </div>
  )
}
