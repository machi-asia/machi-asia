'use client'

import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Switch.module.css'

export type SwitchVariant = 'primary' | 'success' | 'danger'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  variant?: SwitchVariant
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, variant = 'primary', className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <label htmlFor={inputId} className={cx(styles.wrapper, styles[variant], className)}>
      <input ref={ref} id={inputId} type="checkbox" role="switch" className={styles.input} {...rest} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label != null && <span className={styles.label}>{label}</span>}
    </label>
  )
})
