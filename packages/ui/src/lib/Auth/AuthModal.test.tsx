import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthModal } from './AuthModal'

async function renderOpen(overrides: Partial<React.ComponentProps<typeof AuthModal>> = {}) {
  const utils = render(<AuthModal open onClose={() => {}} {...overrides} />)
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  return utils
}

describe('AuthModal', () => {
  it('renders the login form with OAuth buttons by default', async () => {
    await renderOpen()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
  })

  it('submits login credentials and closes on success', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onLogin={onLogin} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amy@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ email: 'amy@example.com', password: 'secret123' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('keeps the modal open and shows the rejection message when login fails', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onLogin={onLogin} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amy@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the authError prop message when provided', async () => {
    await renderOpen({ authError: 'Session expired' })
    expect(screen.getByRole('alert')).toHaveTextContent('Session expired')
  })

  it('disables the form while a login request is pending', async () => {
    let resolve!: () => void
    const onLogin = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res
        }),
    )
    await renderOpen({ onLogin })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amy@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(onLogin).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Google' })).toBeDisabled()
    resolve()
    await waitFor(() => expect(screen.getByLabelText('Email')).not.toBeDisabled())
  })

  it.each(['google', 'github'] as const)('routes the %s provider through onOAuthLogin and closes', async (provider) => {
    const onOAuthLogin = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onOAuthLogin={onOAuthLogin} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: provider === 'google' ? 'Google' : 'GitHub' }))
    await waitFor(() => expect(onOAuthLogin).toHaveBeenCalledWith(provider))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('switches to register mode and submits email and password', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onRegister={onRegister} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'amy@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'longenough1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() =>
      expect(onRegister).toHaveBeenCalledWith({
        email: 'amy@example.com',
        password: 'longenough1',
      }),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('honours initialMode="register"', async () => {
    await renderOpen({ initialMode: 'register' })
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders the guest button when onGuest is provided', async () => {
    await renderOpen({ onGuest: vi.fn() })
    expect(screen.getByRole('button', { name: 'Continue as guest' })).toBeInTheDocument()
  })

  it('hides the guest button when onGuest is not provided', async () => {
    await renderOpen()
    expect(screen.queryByRole('button', { name: 'Continue as guest' })).not.toBeInTheDocument()
  })

  it('calls onGuest and closes on success', async () => {
    const onGuest = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onGuest={onGuest} />)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Continue as guest' }))
    await waitFor(() => expect(onGuest).toHaveBeenCalledOnce())
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
