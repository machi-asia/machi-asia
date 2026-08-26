'use client'

import { createContext, useCallback, useContext, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Accordion.module.css'

interface AccordionContextValue {
  isOpen: (id: string) => boolean
  toggle: (id: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

export type AccordionVariant = 'separated' | 'boxed' | 'flush'

export interface AccordionProps {
  children: ReactNode
  variant?: AccordionVariant
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export function Accordion({ children, variant = 'separated', allowMultiple = false, defaultOpen = [], className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpen))

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        if (prev.has(id)) {
          const next = new Set(prev)
          next.delete(id)
          return next
        }
        return allowMultiple ? new Set(prev).add(id) : new Set([id])
      })
    },
    [allowMultiple],
  )

  const isOpen = useCallback((id: string) => openIds.has(id), [openIds])

  return (
    <AccordionContext.Provider value={{ isOpen, toggle }}>
      <div className={cx(styles.accordion, styles[variant], className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

export interface AccordionItemProps {
  header: ReactNode
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function AccordionItem({ header, children, disabled = false, className }: AccordionItemProps) {
  const id = useId()
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionItem must be used within an Accordion')
  const open = ctx.isOpen(id)

  return (
    <div className={cx(styles.item, open && styles.itemOpen, disabled && styles.itemDisabled, className)}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        disabled={disabled}
        onClick={() => ctx.toggle(id)}
      >
        <span className={styles.headerText}>{header}</span>
        <svg
          className={cx(styles.chevron, open && styles.chevronOpen)}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={`${id}-panel`} role="region" aria-hidden={!open} className={cx(styles.panel, open && styles.panelOpen)}>
        <div className={styles.panelInner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}
