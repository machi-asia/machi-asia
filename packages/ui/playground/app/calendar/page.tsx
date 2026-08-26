'use client'

import { useState } from 'react'
import { Calendar, Card } from '@machi-asia/ui'

export default function CalendarPage() {
  const [selected, setSelected] = useState<Date | null>(null)

  const inTwoWeeks = new Date()
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14)

  return (
    <>
      <div className="pg-hero">
        <h1>Calendar</h1>
        <p>Month navigation slides directionally. Selected dates pop in. Min/max dates are disabled.</p>
      </div>
      <div className="pg-grid">
        <Card padding="md" style={{ justifySelf: 'center' }}>
          <Calendar onChange={setSelected} minDate={new Date()} maxDate={inTwoWeeks} />
        </Card>
        <div className="pg-section" style={{ margin: 0 }}>
          <h2>Selection</h2>
          <p className="pg-hint">Restricted to the next two weeks — earlier and later days are disabled.</p>
          <strong style={{ fontSize: '1.05rem' }}>{selected ? selected.toDateString() : 'No date selected yet'}</strong>
        </div>
      </div>
    </>
  )
}
