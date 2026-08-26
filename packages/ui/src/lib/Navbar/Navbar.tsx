'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { AuthModal } from '../Auth'
import type { AuthUser, LoginCredentials, OAuthProvider, RegisterDetails } from '../Auth/types'
import { cx, useLockScroll, useOnClickOutside } from '../utils'
import styles from './Navbar.module.css'

export interface NavLinkLeaf {
  label: string
  href?: string
  /** Scrolls smoothly to the element with this id instead of navigating. */
  targetId?: string
}

export interface NavLinkItem extends NavLinkLeaf {
  /** Renders a desktop dropdown menu (inline accordion group in the drawer). */
  children?: NavLinkLeaf[]
}

export type NavbarVariant = 'solid' | 'glass' | 'transparent' | 'primary'

export type NavbarLinkAlign = 'left' | 'center' | 'right'

const LINK_ALIGN_CLASS: Record<NavbarLinkAlign, string> = {
  left: 'alignLeft',
  center: 'alignCenter',
  right: 'alignRight',
}

export interface NavbarProps {
  brand?: ReactNode
  links?: NavLinkItem[]
  actions?: ReactNode
  variant?: NavbarVariant
  sticky?: boolean
  /** Alignment of the link group only; brand and action slots are unaffected. */
  linkAlign?: NavbarLinkAlign
  user?: AuthUser | null
  onLogin?: (credentials: LoginCredentials) => void | Promise<unknown>
  onRegister?: (details: RegisterDetails) => void | Promise<unknown>
  onOAuthLogin?: (provider: OAuthProvider) => void | Promise<unknown>
  onSignOut?: () => void
  authError?: string | null
  className?: string
}

function itemKey(item: NavLinkLeaf, index: number) {
  return `${item.label}-${index}`
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length > 1) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
  }
  return words[0].slice(0, 2).toUpperCase()
}

function scrollToSection(id: string, header: HTMLElement | null) {
  const el = document.getElementById(id)
  if (!el) return
  const offset = header?.offsetHeight ?? 0
  const top = el.getBoundingClientRect().top + (window.pageYOffset || 0) - offset
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
  window.history.replaceState(null, '', `#${id}`)
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Avatar({ user }: { user: AuthUser }) {
  if (user.avatarUrl) {
    return <img className={styles.avatarImg} src={user.avatarUrl} alt="" />
  }
  return (
    <span className={styles.avatarFallback} aria-hidden="true">
      {initialsOf(user.displayName ?? user.username ?? '')}
    </span>
  )
}

function UserMenu({ user, onSignOut }: { user: AuthUser; onSignOut?: () => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(rootRef, open, () => setOpen(false))

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const name = user.displayName ?? user.username ?? ''

  return (
    <div ref={rootRef} className={styles.userWrap}>
      <button
        type="button"
        className={styles.userChip}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar user={user} />
        <span className={styles.userName}>{name}</span>
        <ChevronIcon className={cx(styles.userChevron, open && styles.userChevronOpen)} />
      </button>
      {open && (
        <div className={styles.userMenu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.userMenuItem}
            onClick={() => {
              setOpen(false)
              onSignOut?.()
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function SignInButton({ onClick, block = false }: { onClick: () => void; block?: boolean }) {
  return (
    <button type="button" className={cx(styles.signInBtn, block && styles.block)} onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Sign in
    </button>
  )
}

export function Navbar({
  brand,
  links = [],
  actions,
  variant = 'solid',
  sticky = true,
  linkAlign = 'left',
  user = null,
  onLogin,
  onRegister,
  onOAuthLogin,
  onSignOut,
  authError,
  className,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const linksRef = useRef<HTMLUListElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const drawerId = useId()
  const isPrimary = variant === 'primary'
  const signedIn = isPrimary && user != null

  useLockScroll(menuOpen)

  useOnClickOutside(linksRef, openDropdown !== null, () => setOpenDropdown(null))

  useEffect(() => {
    if (openDropdown === null) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpenDropdown(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openDropdown])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const handleSectionClick = (event: ReactMouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault()
    setOpenDropdown(null)
    scrollToSection(targetId, headerRef.current)
  }

  const toggleGroup = (index: number) => {
    setExpandedGroups((groups) => (groups.includes(index) ? groups.filter((g) => g !== index) : [...groups, index]))
  }

  const renderLeafHref = (item: NavLinkLeaf) => (item.href ? item.href : `#${item.targetId ?? ''}`)

  const isSectionLeaf = (item: NavLinkLeaf) => item.targetId != null && !item.href

  return (
    <header
      ref={headerRef}
      className={cx(
        styles.navbar,
        styles[variant],
        sticky && styles.sticky,
        authOpen && styles.belowModal,
        className,
      )}
    >
      <nav className={styles.inner} aria-label="Main">
        <div className={styles.brand}>{brand}</div>
        <ul
          ref={linksRef}
          className={cx(styles.links, styles[LINK_ALIGN_CLASS[linkAlign]])}
        >
          {links.map((link, index) => {
            if (link.children?.length) {
              const dropdownOpen = openDropdown === index
              return (
                <li key={itemKey(link, index)} className={styles.item}>
                  <button
                    type="button"
                    className={cx(styles.link, styles.dropdownTrigger)}
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                    onClick={() => setOpenDropdown((current) => (current === index ? null : index))}
                  >
                    {link.label}
                    <ChevronIcon className={cx(styles.chevron, dropdownOpen && styles.chevronOpen)} />
                  </button>
                  {dropdownOpen && (
                    <div className={styles.menu} role="menu" aria-label={link.label}>
                      {link.children.map((child, childIndex) =>
                        isSectionLeaf(child) ? (
                          <a
                            key={itemKey(child, childIndex)}
                            role="menuitem"
                            href={`#${child.targetId}`}
                            className={styles.menuItem}
                            tabIndex={0}
                            onClick={(event) => handleSectionClick(event, child.targetId!)}
                          >
                            {child.label}
                          </a>
                        ) : (
                          <a
                            key={itemKey(child, childIndex)}
                            role="menuitem"
                            href={renderLeafHref(child)}
                            className={styles.menuItem}
                            tabIndex={0}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                          </a>
                        ),
                      )}
                    </div>
                  )}
                </li>
              )
            }
            if (isSectionLeaf(link)) {
              return (
                <li key={itemKey(link, index)}>
                  <a
                    href={`#${link.targetId}`}
                    className={styles.link}
                    onClick={(event) => handleSectionClick(event, link.targetId!)}
                  >
                    {link.label}
                  </a>
                </li>
              )
            }
            return (
              <li key={itemKey(link, index)}>
                <a href={renderLeafHref(link)} className={styles.link}>
                  {link.label}
                </a>
              </li>
            )
          })}
        </ul>
        <div className={styles.actions}>
          {actions}
          {isPrimary && !signedIn && <SignInButton onClick={() => setAuthOpen(true)} />}
          {signedIn && user != null && <UserMenu user={user} onSignOut={onSignOut} />}
        </div>
        <button
          type="button"
          className={cx(styles.hamburger, menuOpen && styles.hamburgerOpen)}
          aria-expanded={menuOpen}
          aria-controls={drawerId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </nav>
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className={cx(styles.overlay, menuOpen && styles.overlayVisible)}
              aria-hidden="true"
              onClick={() => setMenuOpen(false)}
            />
            <aside id={drawerId} className={cx(styles.drawer, menuOpen && styles.drawerOpen)} aria-hidden={!menuOpen}>
              <ul className={styles.drawerLinks}>
                {links.map((link, index) => {
                  if (link.children?.length) {
                    const expanded = expandedGroups.includes(index)
                    return (
                      <li key={itemKey(link, index)}>
                        <button
                          type="button"
                          className={cx(styles.drawerLink, styles.drawerGroupTrigger)}
                          aria-expanded={expanded}
                          tabIndex={menuOpen ? 0 : -1}
                          onClick={() => toggleGroup(index)}
                        >
                          {link.label}
                          <ChevronIcon className={cx(styles.chevron, expanded && styles.chevronOpen)} />
                        </button>
                        <div className={cx(styles.drawerPanel, expanded && styles.drawerPanelOpen)}>
                          <div className={styles.drawerPanelInner}>
                            {link.children.map((child, childIndex) =>
                              isSectionLeaf(child) ? (
                                <a
                                  key={itemKey(child, childIndex)}
                                  href={`#${child.targetId}`}
                                  className={cx(styles.drawerLink, styles.drawerSublink)}
                                  tabIndex={menuOpen && expanded ? 0 : -1}
                                  onClick={(event) => {
                                    setMenuOpen(false)
                                    handleSectionClick(event, child.targetId!)
                                  }}
                                >
                                  {child.label}
                                </a>
                              ) : (
                                <a
                                  key={itemKey(child, childIndex)}
                                  href={renderLeafHref(child)}
                                  className={cx(styles.drawerLink, styles.drawerSublink)}
                                  tabIndex={menuOpen && expanded ? 0 : -1}
                                  onClick={() => setMenuOpen(false)}
                                >
                                  {child.label}
                                </a>
                              ),
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  }
                  if (isSectionLeaf(link)) {
                    return (
                      <li key={itemKey(link, index)}>
                        <a
                          href={`#${link.targetId}`}
                          className={styles.drawerLink}
                          tabIndex={menuOpen ? 0 : -1}
                          onClick={(event) => {
                            setMenuOpen(false)
                            handleSectionClick(event, link.targetId!)
                          }}
                        >
                          {link.label}
                        </a>
                      </li>
                    )
                  }
                  return (
                    <li key={itemKey(link, index)}>
                      <a
                        href={renderLeafHref(link)}
                        className={styles.drawerLink}
                        tabIndex={menuOpen ? 0 : -1}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
              {(actions != null || isPrimary) && (
                <div className={styles.drawerActions} onClick={() => setMenuOpen(false)}>
                  {actions}
                  {isPrimary && (
                    <div className={styles.drawerAuth}>
                      {user != null ? (
                        <>
                          <div className={styles.drawerUser}>
                            <Avatar user={user} />
                            <span className={styles.drawerUserName}>{user.displayName ?? user.username ?? ''}</span>
                          </div>
                          <button type="button" className={cx(styles.signOutBtn, styles.block)} onClick={() => onSignOut?.()}>
                            Sign out
                          </button>
                        </>
                      ) : (
                        <SignInButton block onClick={() => setAuthOpen(true)} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </>,
          document.body,
        )}
      {isPrimary && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onLogin={onLogin}
          onRegister={onRegister}
          onOAuthLogin={onOAuthLogin}
          authError={authError}
        />
      )}
    </header>
  )
}
