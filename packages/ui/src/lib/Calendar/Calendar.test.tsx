import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from './Calendar'

describe('Calendar', () => {
  it('renders a calendar group with weekday headers and day buttons', () => {
    render(<Calendar defaultValue={new Date(2026, 0, 15)} defaultMonth={new Date(2026, 0, 1)} />)
    expect(screen.getByRole('group', { name: 'Calendar' })).toBeInTheDocument()
    const weekdayCells = document.querySelectorAll('[class*="_weekday_"]')
    expect(weekdayCells.length).toBe(7)
    expect(Array.from(weekdayCells).map((el) => el.textContent)).toEqual([
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
    ])
    expect(screen.getByRole('button', { name: 'Thu Jan 15 2026' })).toBeInTheDocument()
  })

  it('selects a day in uncontrolled mode and reports onChange', () => {
    const onChange = vi.fn()
    render(<Calendar defaultMonth={new Date(2026, 0, 1)} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mon Jan 19 2026' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0].getFullYear()).toBe(2026)
    expect(onChange.mock.calls[0][0].getMonth()).toBe(0)
    expect(onChange.mock.calls[0][0].getDate()).toBe(19)
    expect(screen.getByRole('button', { name: 'Mon Jan 19 2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('stays on the controlled value and still reports clicks', () => {
    const onChange = vi.fn()
    render(
      <Calendar
        value={new Date(2026, 0, 5)}
        defaultMonth={new Date(2026, 0, 1)}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sat Jan 10 2026' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Mon Jan 05 2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Sat Jan 10 2026' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('navigates between months with the header arrows', () => {
    render(<Calendar defaultMonth={new Date(2026, 0, 1)} />)
    expect(screen.queryByRole('button', { name: 'Sun Feb 01 2026' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('button', { name: 'Sun Feb 01 2026' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByRole('button', { name: 'Thu Jan 01 2026' })).toBeInTheDocument()
  })

  it('disables days outside minDate and maxDate', () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 0, 1)}
        minDate={new Date(2026, 0, 10)}
        maxDate={new Date(2026, 0, 20)}
      />,
    )
    expect(screen.getByRole('button', { name: 'Fri Jan 09 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Wed Jan 14 2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Wed Jan 21 2026' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Fri Jan 09 2026' }))
    expect(screen.getByRole('button', { name: 'Fri Jan 09 2026' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('supports Monday-first weeks via weekStartsOn=1', () => {
    render(<Calendar defaultMonth={new Date(2026, 0, 1)} weekStartsOn={1} />)
    const labels = Array.from(document.querySelectorAll('[class*="_weekday_"]')).map(
      (el) => el.textContent,
    )
    expect(labels).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
  })
})
