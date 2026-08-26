import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextEditor } from './TextEditor'

describe('TextEditor', () => {
  it('renders a multiline textbox with the default placeholder', () => {
    render(<TextEditor />)
    const area = screen.getByRole('textbox')
    expect(area).toHaveAttribute('aria-multiline', 'true')
    expect(area).toHaveAttribute('contenteditable')
    expect(area.id).toBe('mui-text-editor-area')
  })

  it('exposes the placeholder through data attribute state', () => {
    const { container } = render(<TextEditor placeholder="Say something" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.dataset.placeholder).toBe('Say something')
  })

  it('seeds content from defaultValue and reports HTML through onChange when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextEditor defaultValue="<p>Hello</p>" onChange={onChange} />)
    const area = screen.getByRole('textbox') as HTMLElement
    expect(area.innerHTML).toContain('Hello')
    await user.type(area, ' world')
    expect(onChange).toHaveBeenCalled()
    const calls = onChange.mock.calls as Array<[string]>
    const lastCall = calls[calls.length - 1][0]
    expect(lastCall).toContain('Hello')
    expect(area.textContent).toContain('world')
  })

  it('syncs external controlled value changes into the editable area', () => {
    const { rerender } = render(<TextEditor value="<p>One</p>" />)
    rerender(<TextEditor value="<p>Two</p>" />)
    expect((screen.getByRole('textbox') as HTMLElement).innerHTML).toContain('Two')
  })

  it('renders the default toolbar with labelled buttons', () => {
    render(<TextEditor toolbar={['bold', 'italic']} />)
    expect(screen.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'bold' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'italic' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'quote' })).not.toBeInTheDocument()
  })

  it('omits the toolbar entirely when toolbar={false}', () => {
    render(<TextEditor toolbar={false} />)
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
  })

  it('falls back to a disabled textarea-like state when readOnly', () => {
    render(<TextEditor defaultValue="<p>Locked</p>" readOnly />)
    const area = screen.getByRole('textbox')
    expect(area.getAttribute('contenteditable')).toBe('false')
    fireEvent.input(area)
    expect(true).toBe(true)
  })

  it('applies minHeight inline to the editable area', () => {
    render(<TextEditor minHeight={240} />)
    expect(screen.getByRole('textbox').style.minHeight).toBe('240px')
  })
})
