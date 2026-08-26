'use client'

import { useState } from 'react'
import { Dropdown } from '@machi-asia/ui'

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
]

export default function DropdownPage() {
  const [fruit, setFruit] = useState<string | null>('banana')

  return (
    <>
      <div className="pg-hero">
        <h1>Dropdown</h1>
        <p>Full keyboard support (arrows, Enter, Escape, Home/End) and touch-friendly 44px options.</p>
      </div>
      <section className="pg-section">
        <h2>Controlled dropdown</h2>
        <div className="pg-row" style={{ marginBottom: 18 }}>
          <Dropdown label="Favorite fruit" options={OPTIONS} value={fruit} onChange={setFruit} />
          <Dropdown
            options={OPTIONS}
            onChange={() => undefined}
            placeholder="Uncontrolled"
          />
          <Dropdown options={OPTIONS} disabled placeholder="Disabled" />
        </div>
        <div className="pg-row" style={{ marginBottom: 18 }}>
          {(['outline', 'filled', 'borderless'] as const).map((variant) => (
            <Dropdown key={variant} variant={variant} options={OPTIONS} defaultValue={variant === 'filled' ? 'cherry' : null} placeholder={variant} />
          ))}
        </div>
        <p style={{ margin: 0 }}>Selected: {fruit ?? 'nothing'}</p>
      </section>
    </>
  )
}
