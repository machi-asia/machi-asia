'use client'

import { useMemo, useState } from 'react'
import { cx } from '../utils'
import styles from './Calendar.module.css'

export interface CalendarProps {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date) => void
  defaultMonth?: Date
  minDate?: Date
  maxDate?: Date
  weekStartsOn?: 0 | 1
  className?: string
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function Calendar({
  value,
  defaultValue = null,
  onChange,
  defaultMonth,
  minDate,
  maxDate,
  weekStartsOn = 0,
  className,
}: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [selected, setSelected] = useState<Date | null>(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : selected

  const anchor = defaultMonth ?? current ?? today
  const [viewYear, setViewYear] = useState(anchor.getFullYear())
  const [viewMonth, setViewMonth] = useState(anchor.getMonth())
  const [direction, setDirection] = useState<'prev' | 'next'>('next')

  const minTime = minDate ? startOfDay(minDate).getTime() : Number.NEGATIVE_INFINITY
  const maxTime = maxDate ? startOfDay(maxDate).getTime() : Number.POSITIVE_INFINITY

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const lead = (first.getDay() - weekStartsOn + 7) % 7
    const total = Math.ceil((lead + daysInMonth) / 7) * 7
    const result: Array<{ date: Date; inMonth: boolean }> = []
    for (let i = 0; i < total; i++) {
      const date = new Date(viewYear, viewMonth, i - lead + 1)
      result.push({ date, inMonth: date.getMonth() === viewMonth })
    }
    return result
  }, [viewYear, viewMonth, weekStartsOn])

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS[(weekStartsOn + i) % 7]),
    [weekStartsOn],
  )

  const goTo = (delta: number) => {
    setDirection(delta > 0 ? 'next' : 'prev')
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const select = (date: Date) => {
    if (!isControlled) setSelected(date)
    onChange?.(date)
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const gridKey = `${viewYear}-${viewMonth}`
  const currentTime = current ? startOfDay(current).getTime() : NaN

  return (
    <div className={cx(styles.calendar, className)} role="group" aria-label="Calendar">
      <div className={styles.header}>
        <button type="button" className={styles.navButton} onClick={() => goTo(-1)} aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.monthLabel} aria-live="polite">{monthLabel}</div>
        <button type="button" className={styles.navButton} onClick={() => goTo(1)} aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className={styles.weekdays}>
        {weekdays.map((label, i) => (
          <div key={`${label}-${i}`} className={styles.weekday} aria-hidden="true">{label}</div>
        ))}
      </div>
      <div key={gridKey} className={cx(styles.grid, direction === 'next' ? styles.slideFromRight : styles.slideFromLeft)}>
        {cells.map(({ date, inMonth }) => {
          const time = date.getTime()
          const disabled = time < minTime || time > maxTime
          const isSelected = time === currentTime
          const isToday = time === today.getTime()
          return (
            <button
              key={time}
              type="button"
              className={cx(
                styles.day,
                !inMonth && styles.outside,
                isSelected && styles.selected,
                isToday && !isSelected && styles.today,
                disabled && styles.disabled,
              )}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={date.toDateString()}
              onClick={() => select(date)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
