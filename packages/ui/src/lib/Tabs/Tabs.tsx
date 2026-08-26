'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: ReactNode
  content: ReactNode
}

export type TabsVariant = 'underline' | 'pills' | 'enclosed'

export interface TabsProps {
  items: TabItem[]
  variant?: TabsVariant
  initialActiveId?: string
  onChange?: (id: string) => void
  className?: string
}

export function Tabs({ items, variant = 'underline', initialActiveId, onChange, className }: TabsProps) {
  const [activeId, setActiveId] = useState(initialActiveId ?? items[0]?.id)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const idBase = useId()

  const measure = useCallback(() => {
    const el = activeId != null ? tabRefs.current.get(activeId) : undefined
    if (!el) return
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [activeId])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const activate = (id: string) => {
    setActiveId(id)
    onChange?.(id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ids = items.map((item) => item.id)
    const currentIndex = Math.max(0, ids.indexOf(activeId))
    let targetIndex: number | null = null
    switch (event.key) {
      case 'ArrowRight':
        targetIndex = (currentIndex + 1) % ids.length
        break
      case 'ArrowLeft':
        targetIndex = (currentIndex - 1 + ids.length) % ids.length
        break
      case 'Home':
        targetIndex = 0
        break
      case 'End':
        targetIndex = ids.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    const targetId = ids[targetIndex]
    if (!targetId) return
    activate(targetId)
    tabRefs.current.get(targetId)?.focus()
  }

  const activeItem = items.find((item) => item.id === activeId)
  const activeIndex = items.findIndex((item) => item.id === activeId)
  const prevIndexRef = useRef(activeIndex)
  const direction = activeIndex >= prevIndexRef.current ? 'forward' : 'back'

  useLayoutEffect(() => {
    prevIndexRef.current = activeIndex
  }, [activeIndex])

  return (
    <div className={cx(styles.tabs, styles[variant], className)}>
      <div role="tablist" aria-orientation="horizontal" className={styles.tablist} onKeyDown={onKeyDown}>
        {items.map((item) => (
          <button
            key={item.id}
            ref={(el) => {
              if (el) tabRefs.current.set(item.id, el)
              else tabRefs.current.delete(item.id)
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${item.id}`}
            aria-selected={item.id === activeId}
            aria-controls={`${idBase}-panel-${item.id}`}
            tabIndex={item.id === activeId ? 0 : -1}
            className={cx(styles.tab, item.id === activeId && styles.tabActive)}
            onClick={() => activate(item.id)}
          >
            {item.label}
          </button>
        ))}
        <span
          className={styles.indicator}
          data-ready={indicator.ready || undefined}
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
      </div>
      {activeItem && (
        <div
          key={activeItem.id}
          role="tabpanel"
          id={`${idBase}-panel-${activeItem.id}`}
          aria-labelledby={`${idBase}-tab-${activeItem.id}`}
          className={cx(styles.panel, direction === 'forward' ? styles.panelForward : styles.panelBack)}
          tabIndex={0}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  )
}
