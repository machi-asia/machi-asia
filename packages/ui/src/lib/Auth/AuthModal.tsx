'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../Button'
import { GitHubIcon } from '../icons/GitHubIcon'
import { GoogleIcon } from '../icons/GoogleIcon'
import { Modal } from '../Modal'
import { cx } from '../utils'
import styles from './AuthModal.module.css'
import type { AuthMode, LoginCredentials, OAuthProvider, RegisterDetails } from './types'

export interface AuthModalProps {
  open: boolean
  onClose: () => void
  onLogin?: (credentials: LoginCredentials) => void | Promise<unknown>
  onRegister?: (details: RegisterDetails) => void | Promise<unknown>
  onOAuthLogin?: (provider: OAuthProvider) => void | Promise<unknown>
  onGuest?: () => void | Promise<unknown>
  authError?: string | null
  initialMode?: AuthMode
}

type Pending = AuthMode | OAuthProvider | 'guest' | null

export function AuthModal({
  open,
  onClose,
  onLogin,
  onRegister,
  onOAuthLogin,
  onGuest,
  authError,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [pending, setPending] = useState<Pending>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setPending(null)
    setLocalError(null)
  }, [open, initialMode])

  const busy = pending !== null
  const displayError = authError ?? localError

  const run = async (key: Exclude<Pending, null>, action: () => void | Promise<unknown>) => {
    if (busy) return
    setPending(key)
    setLocalError(null)
    try {
      await action()
      onClose()
    } catch (err) {
      setLocalError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPending(null)
    }
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setLocalError(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (mode === 'login') {
      void run('login', () =>
        onLogin?.({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      )
    } else {
      void run('register', () =>
        onRegister?.({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'login' ? 'Welcome back' : 'Create your account'}
      size="sm"
    >
      <div className={styles.modeSwitch} role="group" aria-label="Sign in or create an account">
        <button
          type="button"
          className={cx(styles.switchBtn, mode === 'login' && styles.switchBtnActive)}
          aria-pressed={mode === 'login'}
          onClick={() => switchMode('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={cx(styles.switchBtn, mode === 'register' && styles.switchBtnActive)}
          aria-pressed={mode === 'register'}
          onClick={() => switchMode('register')}
        >
          Register
        </button>
      </div>

      <form key={mode} className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email</span>
          <input name="email" type="email" className={styles.input} autoComplete="email" required disabled={busy} />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Password</span>
          <input
            name="password"
            type="password"
            className={styles.input}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : undefined}
            required
            disabled={busy}
          />
        </label>
        {displayError != null && displayError !== '' && (
          <p role="alert" className={styles.error}>
            {displayError}
          </p>
        )}
        <Button
          type="submit"
          fullWidth
          loading={pending === 'login' || pending === 'register'}
          disabled={busy}
        >
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>or continue with</span>
      </div>

      <div className={styles.oauth}>
        <button
          type="button"
          className={styles.oauthBtn}
          disabled={busy}
          onClick={() => void run('google', () => onOAuthLogin?.('google'))}
        >
          <GoogleIcon size={18} />
          Google
        </button>
        <button
          type="button"
          className={styles.oauthBtn}
          disabled={busy}
          onClick={() => void run('github', () => onOAuthLogin?.('github'))}
        >
          <GitHubIcon size={18} />
          GitHub
        </button>
      </div>

      {onGuest && (
        <>
          <div className={styles.divider}>
            <span>or</span>
          </div>
          <Button
            variant="secondary"
            fullWidth
            loading={pending === 'guest'}
            disabled={busy}
            onClick={() => void run('guest', () => onGuest())}
          >
            Continue as guest
          </Button>
        </>
      )}
    </Modal>
  )
}
