import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label as a button of type button by default', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toBeEnabled()
  })

  it('fires onClick with the native button element', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('marks itself busy and disabled while loading and shows a spinner', () => {
    render(<Button loading>Upload</Button>)
    const button = screen.getByRole('button', { name: 'Upload' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('span[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('still respects an explicit disabled prop when not loading', () => {
    render(<Button disabled>Blocked</Button>)
    expect(screen.getByRole('button', { name: 'Blocked' })).toBeDisabled()
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current?.textContent).toContain('Ref')
  })

  it('spreads extra props such as aria labels onto the button', () => {
    render(<Button aria-label="Custom">Icon only</Button>)
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument()
  })
})
