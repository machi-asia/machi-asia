'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cx, useLockScroll } from '../utils'
import styles from './Gallery.module.css'

export type GalleryLayout = 'grid' | 'list'
export type GalleryVariant = 'card' | 'overlay' | 'plain'

export interface GalleryItem {
  id: string
  src: string
  alt?: string
  title?: ReactNode
  subtitle?: ReactNode
}

export interface GalleryProps {
  items: GalleryItem[]
  layout?: GalleryLayout
  variant?: GalleryVariant
  columns?: number
  aspectRatio?: string
  enableLightbox?: boolean
  className?: string
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LIGHTBOX_EXIT_MS = 180

interface LightboxProps {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const item = items[index]
  const [shown, setShown] = useState(false)
  const closingRef = useRef(false)

  useLockScroll(true)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setShown(false)
    window.setTimeout(onClose, LIGHTBOX_EXIT_MS)
  }, [onClose])

  const previous = useCallback(() => {
    onNavigate((index - 1 + items.length) % items.length)
  }, [index, items.length, onNavigate])

  const next = useCallback(() => {
    onNavigate((index + 1) % items.length)
  }, [index, items.length, onNavigate])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
      if (event.key === 'ArrowLeft') previous()
      if (event.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [requestClose, previous, next])

  if (!item) return null

  return (
    <div
      className={cx(styles.lightbox, !shown && styles.lightboxHidden)}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <button type="button" className={styles.lightboxButton} onClick={requestClose} aria-label="Close viewer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
      {items.length > 1 && (
        <>
          <button type="button" className={cx(styles.lightboxButton, styles.navPrev)} onClick={previous} aria-label="Previous image">
            <ChevronIcon direction="left" />
          </button>
          <button type="button" className={cx(styles.lightboxButton, styles.navNext)} onClick={next} aria-label="Next image">
            <ChevronIcon direction="right" />
          </button>
        </>
      )}
      <figure key={item.id} className={styles.lightboxFigure}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.alt ?? ''} className={styles.lightboxImg} draggable={false} />
        {(item.title != null || item.subtitle != null) && (
          <figcaption className={styles.lightboxCaption}>
            {item.title != null && <strong>{item.title}</strong>}
            {item.subtitle != null && <span>{item.subtitle}</span>}
          </figcaption>
        )}
        {items.length > 1 && (
          <div className={styles.counter}>
            {index + 1} / {items.length}
          </div>
        )}
      </figure>
    </div>
  )
}

export function Gallery({
  items,
  layout = 'grid',
  variant = 'card',
  columns,
  aspectRatio = '4 / 3',
  enableLightbox = true,
  className,
}: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const gridRef = useRef<HTMLUListElement>(null)

  const openLightbox = (index: number) => {
    if (enableLightbox) setLightboxIndex(index)
  }

  return (
    <>
      <ul
        ref={gridRef}
        className={cx(styles.gallery, styles[layout], styles[variant], className)}
        style={
          layout === 'grid'
            ? {
                gridTemplateColumns:
                  columns != null
                    ? `repeat(${columns}, minmax(0, 1fr))`
                    : 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
              }
            : undefined
        }
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            className={cx(styles.cell)}
            style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
          >
            <button
              type="button"
              className={cx(styles.item, enableLightbox && styles.clickable)}
              style={layout === 'grid' ? { aspectRatio } : undefined}
              onClick={() => openLightbox(index)}
              aria-label={typeof item.title === 'string' ? `View ${item.title}` : 'View image'}
            >
              <span className={styles.frame} style={layout === 'list' ? { aspectRatio } : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.alt ?? ''} loading="lazy" decoding="async" className={styles.img} />
              </span>
              {(item.title != null || item.subtitle != null) && (
                <span className={cx(styles.meta, variant === 'overlay' && styles.metaOverlay)}>
                  {item.title != null && <span className={styles.title}>{item.title}</span>}
                  {item.subtitle != null && <span className={styles.subtitle}>{item.subtitle}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {enableLightbox && lightboxIndex !== null && (
        <Lightbox items={items} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </>
  )
}
