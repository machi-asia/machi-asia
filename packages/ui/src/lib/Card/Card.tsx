import { forwardRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils'
import styles from './Card.module.css'

export type CardVariant = 'elevated' | 'outline' | 'filled' | 'glass'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children?: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'elevated', hoverable = false, padding = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(styles.card, styles[variant], styles[`pad-${padding}`], hoverable && styles.hoverable, className)}
      {...rest}
    >
      {children}
    </div>
  )
})

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
}

export function CardHeader({ title, subtitle, action, className, children }: CardHeaderProps) {
  return (
    <div className={cx(styles.header, className)}>
      <div className={styles.headerText}>
        {title != null && <div className={styles.title}>{title}</div>}
        {subtitle != null && <div className={styles.subtitle}>{subtitle}</div>}
        {children}
      </div>
      {action != null && <div className={styles.action}>{action}</div>}
    </div>
  )
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function CardBody({ className, children, ...rest }: CardBodyProps) {
  return (
    <div className={cx(styles.body, className)} {...rest}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function CardFooter({ className, children, ...rest }: CardFooterProps) {
  return (
    <div className={cx(styles.footer, className)} {...rest}>
      {children}
    </div>
  )
}
