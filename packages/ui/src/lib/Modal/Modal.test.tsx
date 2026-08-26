import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

function setup(overrides: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn()
  const utils = render(
    <Modal open onClose={onClose} title="My modal" {...overrides}>
      <p>Body content</p>
    </Modal>,
  )
  return { onClose, ...utils }
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        <p>Secret</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders a dialog with title and body through a portal', async () => {
    setup()
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByText('My modal')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(document.body).toContainElement(dialog)
  })

  it('moves focus into the panel once fully open', async () => {
    render(
      <div>
        <button type="button">Outside</button>
        <Modal open onClose={() => {}}>
          <button type="button">Inside</button>
        </Modal>
      </div>,
    )
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
  })

  it('calls onClose when Escape is pressed while open', async () => {
    const { onClose } = setup()
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose for backdrop mousedown on the overlay itself only', async () => {
    const { onClose } = setup()
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    const overlay = screen.getByRole('dialog').parentElement!
    fireEvent.mouseDown(overlay, { target: overlay })
    expect(onClose).toHaveBeenCalledOnce()
    onClose.mockClear()
    const body = screen.getByText('Body content')
    fireEvent.mouseDown(body)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('respects closeOnBackdrop=false', async () => {
    const { onClose } = setup({ closeOnBackdrop: false })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    const overlay = screen.getByRole('dialog').parentElement!
    fireEvent.mouseDown(overlay, { target: overlay })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders the footer actions', async () => {
    setup({ footer: <button type="button">Confirm</button> })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('unmounts after the exit animation once open flips to false', async () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Leaving">
        <p>x</p>
      </Modal>,
    )
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    rerender(
      <Modal open={false} onClose={() => {}} title="Leaving">
        <p>x</p>
      </Modal>,
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 1000,
    })
  })
})
