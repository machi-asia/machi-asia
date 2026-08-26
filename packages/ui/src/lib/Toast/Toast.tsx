'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Toast.module.css'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  variant?: ToastVariant
  duration?: number
}

interface ToastEntry extends ToastOptions {
  id: number
  leaving: boolean
}

export interface ToastApi {
  show: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION = 4000
const EXIT_MS = 200
const MAX_VISIBLE = 5

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const clearTimer = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id)
      setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, EXIT_MS)
    },
    [clearTimer],
  )

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...options, id, leaving: false }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), options.duration ?? DEFAULT_DURATION),
      )
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={styles.viewport} role="region" aria-label="Notifications">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cx(styles.toast, styles[toast.variant ?? 'info'], toast.leaving && styles.leaving)}
                role={toast.variant === 'error' ? 'alert' : 'status'}
              >
                <div className={styles.content}>
                  <div className={styles.title}>{toast.title}</div>
                  {toast.description != null && <div className={styles.description}>{toast.description}</div>}
                </div>
                <button type="button" className={styles.close} onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
