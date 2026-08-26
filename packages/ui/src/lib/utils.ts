import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useInView<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { threshold = 0.2, rootMargin = '0px', once = true }: UseInViewOptions = {},
) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold, rootMargin, once])

  return inView
}

export function useScrollLoop<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onFrame: () => void,
  enabled = true,
) {
  const frameRef = useRef(onFrame)
  frameRef.current = onFrame

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    let rafId = 0
    let running = false
    let gate: IntersectionObserver | undefined

    const measure = () => {
      rafId = 0
      if (el.isConnected) frameRef.current()
    }

    const schedule = () => {
      if (!rafId && running) rafId = requestAnimationFrame(measure)
    }

    const start = () => {
      if (running) return
      running = true
      measure()
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule)
    }

    const stop = () => {
      running = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }

    if (typeof IntersectionObserver === 'undefined') {
      start()
    } else {
      gate = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((entry) => entry.isIntersecting)
          if (visible) start()
          else stop()
        },
        { rootMargin: '20% 0px 20% 0px' },
      )
      gate.observe(el)
      start()
    }

    return () => {
      gate?.disconnect()
      stop()
    }
  }, [ref, enabled])
}

export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useScrollLoop(
    ref,
    () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight || 1
      const progress = clamp01((vh - rect.top) / Math.max(rect.height + vh, 1))
      el.style.setProperty('--mui-progress', progress.toFixed(4))
    },
    enabled,
  )
}

/**
 * Progress for a pinned (sticky) section: 0 when the section's top reaches the
 * viewport top, 1 when its bottom leaves. Expects the section to be taller
 * than the viewport.
 */
export function usePinProgress<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useScrollLoop(
    ref,
    () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight || 1
      const progress = clamp01(-rect.top / Math.max(rect.height - vh, 1))
      el.style.setProperty('--mui-progress', progress.toFixed(4))
    },
    enabled,
  )
}

let scrollLockCount = 0
let scrollLockOriginal = ''

export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    scrollLockCount += 1
    if (scrollLockCount === 1) {
      scrollLockOriginal = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      scrollLockCount -= 1
      if (scrollLockCount === 0) {
        document.body.style.overflow = scrollLockOriginal
      }
    }
  }, [active])
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  handler: () => void,
) {
  useEffect(() => {
    if (!active) return
    const listener = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) handler()
    }
    document.addEventListener('pointerdown', listener)
    return () => document.removeEventListener('pointerdown', listener)
  }, [ref, active, handler])
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
