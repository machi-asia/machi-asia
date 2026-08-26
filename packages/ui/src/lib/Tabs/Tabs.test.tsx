import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'
import type { TabItem } from './Tabs'

const items: TabItem[] = [
  { id: 'a', label: 'Alpha', content: <p>Panel A</p> },
  { id: 'b', label: 'Beta', content: <p>Panel B</p> },
  { id: 'c', label: 'Gamma', content: <p>Panel C</p> },
]

describe('Tabs', () => {
  it('renders all tabs and shows only the first panel initially', () => {
    render(<Tabs items={items} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Panel A')).toBeInTheDocument()
    expect(screen.queryByText('Panel B')).not.toBeInTheDocument()
  })

  it('activates a tab on click and reports the change', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel B')).toBeInTheDocument()
    expect(screen.queryByText('Panel A')).not.toBeInTheDocument()
  })

  it('honours initialActiveId when provided', () => {
    render(<Tabs items={items} initialActiveId="c" />)
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel C')).toBeInTheDocument()
  })

  it('moves activation with ArrowRight and ArrowLeft and wraps around', () => {
    const onChange = vi.fn()
    render(<Tabs items={items} onChange={onChange} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    expect(onChange).toHaveBeenLastCalledWith('c')
  })

  it('supports Home and End keys', () => {
    render(<Tabs items={items} initialActiveId="b" />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
  })

  it('wires tabpanel accessibility attributes to the active tab', () => {
    render(<Tabs items={items} initialActiveId="b" />)
    const tab = screen.getByRole('tab', { name: 'Beta' })
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAccessibleName('Beta')
    expect(tab.getAttribute('aria-controls')).toBe(panel.id)
  })

  it('only the active tab is part of the tab order', () => {
    render(<Tabs items={items} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
  })
})
