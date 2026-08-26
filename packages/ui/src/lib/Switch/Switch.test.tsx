import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('renders a checkbox with switch semantics', () => {
    render(<Switch label="Notifications" />)
    const input = screen.getByRole('switch', { name: 'Notifications' })
    expect(input).toHaveAttribute('type', 'checkbox')
    expect(input).not.toBeChecked()
  })

  it('toggles when the label or track is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch label="Dark mode" onChange={onChange} />)
    const input = screen.getByRole('switch', { name: 'Dark mode' })
    await user.click(screen.getByText('Dark mode'))
    expect(input).toBeChecked()
    expect(onChange).toHaveBeenCalledTimes(1)
    await user.click(input)
    expect(input).not.toBeChecked()
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('associates the label through an explicit id when provided', () => {
    render(<Switch id="my-switch" label="Auto save" />)
    const label = screen.getByText('Auto save').closest('label')
    expect(label).toHaveAttribute('for', 'my-switch')
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'my-switch')
  })

  it('respects defaultChecked and controlled checked props', () => {
    const { rerender } = render(<Switch label="A" defaultChecked />)
    expect(screen.getByRole('switch', { name: 'A' })).toBeChecked()
    rerender(<Switch label="B" checked={false} readOnly />)
    expect(screen.getByRole('switch', { name: 'B' })).not.toBeChecked()
  })

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Switch ref={ref} label="R" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
