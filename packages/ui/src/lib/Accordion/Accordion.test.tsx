import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Accordion, AccordionItem } from './Accordion'

function setup(props: Partial<React.ComponentProps<typeof Accordion>> = {}) {
  return render(
    <Accordion {...props}>
      <AccordionItem header="First">Content one</AccordionItem>
      <AccordionItem header="Second" disabled>
        Content two
      </AccordionItem>
      <AccordionItem header="Third">Content three</AccordionItem>
    </Accordion>,
  )
}

describe('Accordion', () => {
  it('starts collapsed and expands a section when its header is clicked', () => {
    setup({ defaultOpen: [] })
    const first = screen.getByRole('button', { name: /First/ })
    expect(first).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Content one').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false')
  })

  it('collapses the open section when the header is clicked again', () => {
    setup()
    const first = screen.getByRole('button', { name: /First/ })
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
  })

  it('allows only one open item by default (exclusive mode)', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /First/ }))
    fireEvent.click(screen.getByRole('button', { name: /Third/ }))
    expect(screen.getByRole('button', { name: /First/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /Third/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps multiple sections open when allowMultiple is set', () => {
    setup({ allowMultiple: true })
    fireEvent.click(screen.getByRole('button', { name: /First/ }))
    fireEvent.click(screen.getByRole('button', { name: /Third/ }))
    expect(screen.getByRole('button', { name: /First/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Third/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not toggle disabled items and exposes aria-controls wiring', () => {
    setup()
    const disabledHeader = screen.getByRole('button', { name: /Second/ })
    expect(disabledHeader).toBeDisabled()
    fireEvent.click(disabledHeader)
    expect(disabledHeader).toHaveAttribute('aria-expanded', 'false')
    const controls = disabledHeader.getAttribute('aria-controls') ?? ''
    expect(document.getElementById(controls)).not.toBeNull()
  })

  it('throws a helpful error when AccordionItem is used outside Accordion', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AccordionItem header="Orphan">x</AccordionItem>)).toThrow(
      /must be used within an Accordion/,
    )
    consoleError.mockRestore()
    return waitFor(() => expect(true).toBe(true))
  })
})
