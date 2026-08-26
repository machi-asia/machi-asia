import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from './Table'
import type { TableColumn } from './Table'

interface Person {
  name: string
  age: number
}

const columns: Array<TableColumn<Person>> = [
  { key: 'name', header: 'Name', sortable: true, sortValue: (row) => row.name },
  { key: 'age', header: 'Age', sortable: true, sortValue: (row) => row.age },
]

const people: Person[] = [
  { name: 'Cara', age: 31 },
  { name: 'Abe', age: 25 },
  { name: 'Bea', age: 28 },
]

function cellValues() {
  return Array.from(document.querySelectorAll('tbody tr td:first-child')).map(
    (cell) => cell.textContent,
  )
}

describe('Table', () => {
  it('renders headers and one row per data entry', () => {
    render(<Table columns={columns} data={people} rowKey={(row) => row.name} />)
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument()
    expect(document.querySelectorAll('tbody tr').length).toBe(3)
    expect(screen.getByText('Abe')).toBeInTheDocument()
  })

  it('sorts asc on first click, desc on second, back to original order on third', () => {
    render(<Table columns={columns} data={people} />)
    const nameHeader = screen.getByRole('button', { name: 'Name' })
    fireEvent.click(nameHeader)
    expect(cellValues()).toEqual(['Abe', 'Bea', 'Cara'])
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    fireEvent.click(nameHeader)
    expect(cellValues()).toEqual(['Cara', 'Bea', 'Abe'])
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    fireEvent.click(nameHeader)
    expect(cellValues()).toEqual(['Cara', 'Abe', 'Bea'])
    expect(screen.getByRole('columnheader', { name: /Name/ })).not.toHaveAttribute('aria-sort')
  })

  it('sorts numerically via sortValue rather than lexicographically', () => {
    render(<Table columns={columns} data={people} />)
    fireEvent.click(screen.getByRole('button', { name: 'Age' }))
    expect(Array.from(document.querySelectorAll('tbody tr td:nth-child(2)')).map((c) => c.textContent)).toEqual([
      '25',
      '28',
      '31',
    ])
  })

  it('renders custom cells through the cell renderer', () => {
    render(
      <Table
        columns={[
          {
            key: 'name',
            header: 'Name',
            cell: (row) => <strong>{row.name.toUpperCase()}</strong>,
          },
        ]}
        data={[{ name: 'zed' }]}
      />,
    )
    expect(screen.getByText('ZED').tagName).toBe('STRONG')
  })

  it('shows the loading spinner instead of rows while loading', () => {
    render(<Table columns={columns} data={people} loading />)
    expect(document.querySelector('span[aria-label="Loading"]')).not.toBeNull()
    expect(document.querySelectorAll('tbody tr').length).toBe(1)
  })

  it('shows the custom empty message when data is empty', () => {
    render(<Table columns={columns} data={[]} emptyMessage="Nothing here yet" />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('fires onRowClick with the row payload', () => {
    const onRowClick = vi.fn()
    render(<Table columns={columns} data={people} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Bea'))
    expect(onRowClick).toHaveBeenCalledWith({ name: 'Bea', age: 28 }, 2)
  })

  it('renders caption and footer cells only when enabled', () => {
    render(
      <Table
        columns={[...columns, { key: 'age', header: 'Total', footer: '84 total' } as TableColumn<Person>]}
        data={people}
        caption="Team roster"
        footer
      />,
    )
    expect(screen.getByText('Team roster')).toBeInTheDocument()
    expect(screen.getByText('84 total')).toBeInTheDocument()
  })
})
