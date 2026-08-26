'use client'

import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Footer.module.css'

export interface FooterLink {
  label: string
  href: string
}

export type FooterVariant = 'solid' | 'transparent'

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** Optional logo or brand node rendered on the left. */
  brand?: ReactNode
  links?: FooterLink[]
  /** Bottom bar content, e.g. copyright. Rendered in a separated row when provided. */
  note?: ReactNode
  variant?: FooterVariant
}

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { brand, links = [], note, variant = 'solid', className, children, ...rest },
  ref,
) {
  return (
    <footer ref={ref} className={cx(styles.footer, styles[variant], className)} {...rest}>
      <div className={styles.inner}>
        {brand != null && <div className={styles.brand}>{brand}</div>}
        {children != null && <div className={styles.content}>{children}</div>}
        {links.length > 0 && (
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a href={link.href} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {note != null && (
        <div className={styles.noteRow}>
          <div className={styles.noteInner}>{note}</div>
        </div>
      )}
    </footer>
  )
})
