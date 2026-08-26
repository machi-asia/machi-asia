import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dropdown } from './Dropdown'
import type { DropdownOption } from './Dropdown'

const options: DropdownOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta' },
]

function getTrigger() {
  return screen.getByRole('button', { name: /Select an option|Alpha|Beta|Gamma|Delta/ })
}

function isOpen() {
  return getTrigger().getAttribute('aria-expanded') === 'true'
}

describe('Dropdown', () => {
  it('shows the placeholder collapsed initially and opens on click', () => {
    render(<Dropdown options={options} />)
    expect(getTrigger()).toHaveTextContent('Select an option')
    expect(isOpen()).toBe(false)
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-activedescendant')
    fireEvent.click(getTrigger())
    expect(isOpen()).toBe(true)
    const activeId = screen.getByRole('listbox').getAttribute('aria-activedescendant')
    expect(activeId).toBe(screen.getByRole('option', { name: 'Alpha' }).id)
    for (const label of ['Alpha', 'Beta', 'Gamma', 'Delta']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
  })

  it('commits an option on click, reports onChange and closes (uncontrolled)', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} onChange={onChange} />)
    fireEvent.click(getTrigger())
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(getTrigger()).toHaveTextContent('Beta')
    expect(isOpen()).toBe(false)
  })

  it('never commits disabled options', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} onChange={onChange} defaultValue="a" />)
    fireEvent.click(getTrigger())
    fireEvent.click(screen.getByRole('option', { name: 'Gamma' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(isOpen()).toBe(true)
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('stays on the controlled value after selection attempts', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} value="a" onChange={onChange} />)
    fireEvent.click(getTrigger())
    fireEvent.click(screen.getByRole('option', { name: 'Delta' }))
    expect(onChange).toHaveBeenCalledWith('d')
    expect(getTrigger()).toHaveTextContent('Alpha')
    expect(screen.getByRole('option', { name: 'Delta' })).toHaveAttribute('aria-selected', 'false')
  })

  it('selects with keyboard: Enter opens, ArrowDown highlights skipping disabled, Enter commits', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} onChange={onChange} />)
    const trigger = getTrigger()
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(isOpen()).toBe(true)
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Delta' }).id,
    )
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('d')
    expect(isOpen()).toBe(false)
  })

  it('closes on Escape without committing', () => {
    const onChange = vi.fn()
    render(<Dropdown options={options} onChange={onChange} />)
    fireEvent.click(getTrigger())
    expect(isOpen()).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(isOpen()).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marks the selected option and disables the trigger when disabled', () => {
    render(<Dropdown options={options} defaultValue="b" disabled />)
    const trigger = getTrigger()
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveTextContent('Beta')
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(trigger)
    expect(isOpen()).toBe(false)
  })
})
