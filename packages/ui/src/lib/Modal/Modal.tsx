'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { cx, useLockScroll } from '../utils'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeOnBackdrop?: boolean
  className?: string
}

const ANIMATION_MS = 240

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Phase = 'closed' | 'enter' | 'open' | 'exit'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const [phase, setPhase] = useState<Phase>('closed')
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    setPhase((p) => (p === 'closed' ? 'enter' : p === 'exit' ? 'open' : p))
  }, [open])

  useEffect(() => {
    if (open || phase === 'closed' || phase === 'exit') return
    setPhase('exit')
  }, [open, phase])

  useEffect(() => {
    if (phase !== 'enter') return
    const raf = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    if (phase !== 'exit') return
    const timer = window.setTimeout(() => setPhase('closed'), ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  const mounted = phase !== 'closed'

  useLockScroll(mounted)

  useEffect(() => {
    if (phase !== 'open') return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previouslyFocused.current?.isConnected) previouslyFocused.current.focus()
    }
  }, [phase])

  if (!mounted || typeof document === 'undefined') return null

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null,
    )
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const onBackdropMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      className={cx(styles.overlay, phase === 'open' && styles.overlayOpen)}
      onMouseDown={onBackdropMouseDown}
      aria-hidden={phase !== 'open' || undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx(styles.panel, styles[size], phase === 'open' && styles.panelOpen, className)}
        onKeyDown={onKeyDown}
      >
        <div className={cx(styles.header, title == null && styles.headerNoTitle)}>
          {title != null && <h2 className={styles.title}>{title}</h2>}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
