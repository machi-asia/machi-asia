'use client'

import { useState } from 'react'
import { Tabs } from '@machi-asia/ui'

const LOREM = [
  'The indicator glides between tabs with a spring curve.',
  'Content panels fade and rise in when activated.',
  'Arrow Left/Right, Home and End keys all switch tabs (roving tabindex).',
  'The tab strip scrolls horizontally when it overflows on small screens.',
]

export default function TabsPage() {
  const [lastChanged, setLastChanged] = useState<string>('one')

  return (
    <>
      <div className="pg-hero">
        <h1>Tabs</h1>
        <p>Sliding indicator with spring easing, animated panels, keyboard navigation.</p>
      </div>
      <section className="pg-section">
        <h2>Variants</h2>
        <div style={{ display: 'grid', gap: 26 }}>
          {(['underline', 'pills', 'enclosed'] as const).map((variant) => (
            <div key={variant}>
              <p style={{ margin: '0 0 8px', color: 'var(--mui-text-muted)', fontSize: '.85rem' }}>variant=&quot;{variant}&quot;</p>
              <Tabs
                variant={variant}
                onChange={setLastChanged}
                items={[
                  { id: `one-${variant}`, label: 'First', content: LOREM[0] },
                  { id: `two-${variant}`, label: 'Second', content: LOREM[1] },
                  { id: `three-${variant}`, label: 'Keyboard', content: LOREM[2] },
                  { id: `four-${variant}`, label: 'Overflowing tab label example', content: LOREM[3] },
                ]}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="pg-section">
        <p style={{ margin: 0 }}>Last changed via onChange: <strong>{lastChanged}</strong></p>
      </section>
    </>
  )
}
