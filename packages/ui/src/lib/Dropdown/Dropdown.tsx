'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { cx, useOnClickOutside } from '../utils'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export type DropdownVariant = 'outline' | 'filled' | 'borderless'

export interface DropdownProps {
  options: DropdownOption[]
  variant?: DropdownVariant
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
}

export function Dropdown({
  options,
  variant = 'outline',
  value,
  defaultValue = null,
  onChange,
  placeholder = 'Select an option',
  label,
  disabled = false,
  className,
}: DropdownProps) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue)
  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const idBase = useId()

  const selectedIndex = options.findIndex((option) => option.value === selectedValue)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  useOnClickOutside(rootRef, open, () => setOpen(false))

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (selectedIndex >= 0 && !options[selectedIndex].disabled) {
      setHighlighted(selectedIndex)
      return
    }
    const firstEnabled = options.findIndex((option) => !option.disabled)
    setHighlighted(firstEnabled)
  }, [open])

  useEffect(() => {
    if (!open || highlighted < 0) return
    listRef.current?.children[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const nextEnabledIndex = (from: number, delta: number) => {
    const length = options.length
    for (let step = 1; step <= length; step++) {
      const index = (((from + delta * step) % length) + length) % length
      if (!options[index].disabled) return index
    }
    return -1
  }

  const commit = (option: DropdownOption) => {
    if (option.disabled) return
    if (!isControlled) setInternalValue(option.value)
    onChange?.(option.value)
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) {
          setOpen(true)
        } else {
          setHighlighted((h) => nextEnabledIndex(h < 0 ? -1 : h, 1))
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) {
          setOpen(true)
        } else {
          setHighlighted((h) => nextEnabledIndex(h < 0 ? 0 : h, -1))
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) {
          setOpen(true)
        } else if (highlighted >= 0) {
          commit(options[highlighted])
        }
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setHighlighted(nextEnabledIndex(-1, 1))
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setHighlighted(nextEnabledIndex(0, -1))
        }
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      {label != null && (
        <span className={styles.label} id={`${idBase}-label`}>
          {label}
        </span>
      )}
      <button
        type="button"
        className={cx(styles.trigger, styles[variant], open && styles.triggerOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label != null ? `${idBase}-label ${idBase}-value` : `${idBase}-value`}
        onKeyDown={onKeyDown}
        onClick={() => setOpen((o) => !o)}
      >
        <span id={`${idBase}-value`} className={cx(styles.value, !selectedOption && styles.placeholder)}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={cx(styles.arrow, open && styles.arrowOpen)}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        ref={listRef}
        role="listbox"
        aria-activedescendant={open && highlighted >= 0 ? `${idBase}-opt-${highlighted}` : undefined}
        className={cx(styles.listbox, open && styles.open)}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={`${idBase}-opt-${index}`}
            role="option"
            aria-selected={option.value === selectedValue}
            aria-disabled={option.disabled || undefined}
            className={cx(
              styles.option,
              index === highlighted && styles.highlighted,
              option.value === selectedValue && styles.selected,
              option.disabled && styles.optionDisabled,
            )}
            onMouseEnter={() => !option.disabled && setHighlighted(index)}
            onClick={() => commit(option)}
            style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
          >
            {option.label}
            {option.value === selectedValue && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
