import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './Toast'

function ToastHarness({ duration }: { duration?: number }) {
  const { show, dismiss } = useToast()
  return (
    <div>
      <button type="button" onClick={() => show({ title: 'Saved', variant: 'success', duration })}>
        show success
      </button>
      <button type="button" onClick={() => show({ title: 'Boom', description: 'It broke', variant: 'error' })}>
        show error
      </button>
      <button type="button" onClick={() => dismiss(1)}>
        dismiss first
      </button>
    </div>
  )
}

describe('Toast', () => {
  it('throws a helpful error when used outside a ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ToastHarness />)).toThrow(/must be used within a ToastProvider/)
    consoleError.mockRestore()
  })

  it('renders a success toast as a status region inside the portal viewport', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'show success' }))
    const region = await screen.findByRole('region', { name: 'Notifications' })
    expect(document.body).toContainElement(region)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders error toasts with alert semantics', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'show error' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Boom')
    expect(screen.getByText('It broke')).toBeInTheDocument()
  })

  it('removes a toast after the exit transition when dismissed manually', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'show success' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    await waitFor(
      () => expect(screen.queryByText('Saved')).not.toBeInTheDocument(),
      { timeout: 1000 },
    )
  }, 5000)

  it('auto-dismisses after the given duration', async () => {
    render(
      <ToastProvider>
        <ToastHarness duration={60} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'show success' }))
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(
      () => expect(screen.queryByText('Saved')).not.toBeInTheDocument(),
      { timeout: 1500 },
    )
  }, 5000)

  it('caps visible toasts at five', async () => {
    function Spammer() {
      const { show } = useToast()
      return (
        <button
          type="button"
          onClick={() => {
            for (let i = 1; i <= 7; i++) show({ title: `T${i}` })
          }}
        >
          spam
        </button>
      )
    }
    render(
      <ToastProvider>
        <Spammer />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'spam' }))
    await screen.findByText('T7')
    const statuses = document.querySelectorAll('[role="status"]')
    expect(statuses.length).toBe(5)
    expect(screen.queryByText('T1')).not.toBeInTheDocument()
  })
})
