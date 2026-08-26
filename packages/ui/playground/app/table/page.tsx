'use client'

import { useState } from 'react'
import { Button, Table, ToastProvider, useToast } from '@machi-asia/ui'
import type { TableColumn } from '@machi-asia/ui'

interface Product {
  name: string
  category: string
  price: number
  stock: number
}

const DATA: Product[] = [
  { name: 'Wireless Keyboard', category: 'Peripherals', price: 49.99, stock: 132 },
  { name: 'USB-C Hub', category: 'Accessories', price: 34.5, stock: 87 },
  { name: '27" Monitor', category: 'Displays', price: 289, stock: 21 },
  { name: 'Mechanical Mouse', category: 'Peripherals', price: 59, stock: 64 },
  { name: 'Laptop Stand', category: 'Accessories', price: 25, stock: 0 },
  { name: 'Webcam Pro', category: 'Video', price: 119.95, stock: 45 },
]

const COLUMNS: Array<TableColumn<Product>> = [
  { key: 'name', header: 'Product', sortable: true, sortValue: (p) => p.name },
  { key: 'category', header: 'Category', sortable: true, sortValue: (p) => p.category, hideBelow: 'sm' },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    sortable: true,
    sortValue: (p) => p.price,
    cell: (p) => `$${p.price.toFixed(2)}`,
    footer: '$577.44',
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    sortable: true,
    sortValue: (p) => p.stock,
    hideBelow: 'md',
    cell: (p) =>
      p.stock === 0 ? (
        <span style={{ color: 'var(--mui-danger)', fontWeight: 600 }}>Out</span>
      ) : (
        p.stock
      ),
    footer: '349 units',
  },
]

function LoadingDemo() {
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  return (
    <div>
      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        onClick={() => {
          setLoading(true)
          setTimeout(() => {
            setLoading(false)
            toast.show({ title: 'Data refreshed', variant: 'success' })
          }, 1500)
        }}
      >
        {loading ? 'Refreshing…' : 'Simulate refresh'}
      </Button>
      <div style={{ height: 14 }} />
      <Table columns={COLUMNS} data={DATA} rowKey={(p) => p.name} variant="minimal" loading={loading} size="sm" />
    </div>
  )
}

export default function TablePage() {
  return (
    <ToastProvider>
      <div className="pg-hero">
        <h1>Table</h1>
        <p>Sortable columns, sticky headers, footer rows, loading and empty states. On mobile the wrapper scrolls horizontally; columns can opt out via hideBelow.</p>
      </div>

      <section className="pg-section">
        <h2>Variants (click headers to sort)</h2>
        <p className="pg-hint">default · striped · bordered · minimal — plus a sticky header.</p>
        <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 20 }}>
          <Table
            columns={COLUMNS.map((c) => ({ ...c, footer: undefined }))}
            data={[...DATA, ...DATA]}
            rowKey={(p, i) => `${p.name}-${i}`}
            caption="Sticky header table"
          />
        </div>
      </section>

      {(['striped', 'bordered', 'minimal'] as const).map((variant) => (
        <section className="pg-section" key={variant}>
          <h2>variant=&quot;{variant}&quot;</h2>
          <Table columns={COLUMNS} data={DATA.slice(0, 4)} rowKey={(p) => p.name} variant={variant} />
        </section>
      ))}

      <section className="pg-section">
        <h2>Loading state</h2>
        <LoadingDemo />
      </section>

      <section className="pg-section">
        <h2>Empty state</h2>
        <Table columns={COLUMNS} data={[]} emptyMessage="No products match your filters." />
      </section>
    </ToastProvider>
  )
}
