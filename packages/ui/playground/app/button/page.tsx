'use client'

import { useState } from 'react'
import { Button } from '@machi-asia/ui'

export default function ButtonPage() {
  const [loading, setLoading] = useState(false)

  return (
    <>
      <div className="pg-hero">
        <h1>Button</h1>
        <p>Four variants, three sizes, loading state. Press any button to feel the tap animation.</p>
      </div>
      <section className="pg-section">
        <h2>Variants</h2>
        <div className="pg-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>
      <section className="pg-section">
        <h2>Sizes</h2>
        <div className="pg-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>
      <section className="pg-section">
        <h2>Loading + full width</h2>
        <div className="pg-row" style={{ marginBottom: 14 }}>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 2000)
            }}
          >
            {loading ? 'Saving…' : 'Click to load'}
          </Button>
        </div>
        <Button fullWidth variant="secondary">
          Full width button
        </Button>
      </section>
    </>
  )
}
