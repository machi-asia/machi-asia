'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Table.module.css'

export type TableVariant = 'default' | 'striped' | 'bordered' | 'minimal'

export interface TableColumn<Row> {
  key: string
  header: ReactNode
  cell?: (row: Row, index: number) => ReactNode
  sortValue?: (row: Row) => string | number
  align?: 'left' | 'center' | 'right'
  width?: number | string
  sortable?: boolean
  hideBelow?: 'sm' | 'md'
  footer?: ReactNode
}

export interface TableProps<Row> {
  columns: Array<TableColumn<Row>>
  data: Row[]
  rowKey?: (row: Row, index: number) => string | number
  variant?: TableVariant
  size?: 'sm' | 'md'
  hoverable?: boolean
  stickyHeader?: boolean
  loading?: boolean
  emptyMessage?: ReactNode
  caption?: ReactNode
  footer?: boolean
  onRowClick?: (row: Row, index: number) => void
  className?: string
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | null
}

function SortIndicator({ direction }: SortIndicatorProps) {
  return (
    <svg
      className={cx(styles.sortIcon, direction === 'desc' && styles.sortDesc)}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 5v14m0-14l-5 5m5-5l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Table<Row>({
  columns,
  data,
  rowKey,
  variant = 'default',
  size = 'md',
  hoverable = true,
  stickyHeader = false,
  loading = false,
  emptyMessage = 'No data',
  caption,
  footer = false,
  onRowClick,
  className,
}: TableProps<Row>) {
  const [sort, setSort] = useState<SortState>(null)

  const sortedData = useMemo(() => {
    if (!sort) return data
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return data
    const accessor = column.sortValue
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [data, sort, columns])

  const toggleSort = (key: string) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  const getCellValue = (column: TableColumn<Row>, row: Row, index: number): ReactNode => {
    if (column.cell) return column.cell(row, index)
    const value = (row as Record<string, unknown>)[column.key]
    return value == null ? '' : String(value)
  }

  return (
    <div className={styles.wrapper}>
      <table className={cx(styles.table, styles[variant], styles[size], className)}>
        {caption != null && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={cx(
                    styles.th,
                    column.align && styles[`align-${column.align}`],
                    column.hideBelow && styles[`hide-${column.hideBelow}`],
                    stickyHeader && styles.stickyTh,
                    column.sortable && styles.sortableTh,
                    active && styles.sortedTh,
                  )}
                  aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {column.sortable ? (
                    <button type="button" className={styles.sortButton} onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <SortIndicator direction={active ? sort!.direction : null} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles.centerCell}>
                <span className={styles.spinner} aria-label="Loading" />
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={cx(styles.centerCell, styles.emptyCell)}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className={cx(hoverable && styles.hoverRow, onRowClick && styles.clickableRow)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      styles.td,
                      column.align && styles[`align-${column.align}`],
                      column.hideBelow && styles[`hide-${column.hideBelow}`],
                    )}
                  >
                    {getCellValue(column, row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && !loading && (
          <tfoot>
            <tr>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    styles.tfoot,
                    column.align && styles[`align-${column.align}`],
                    column.hideBelow && styles[`hide-${column.hideBelow}`],
                  )}
                >
                  {column.footer}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
