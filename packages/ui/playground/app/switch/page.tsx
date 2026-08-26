'use client'

import { useState } from 'react'
import { Switch, ToastProvider } from '@machi-asia/ui'

function Controlled() {
  const [on, setOn] = useState(false)
  return (
    <Switch
      label={`Controlled: ${on ? 'ON' : 'OFF'}`}
      checked={on}
      onChange={(e) => setOn(e.target.checked)}
    />
  )
}

export default function SwitchPage() {
  return (
    <ToastProvider>
      <div className="pg-hero">
        <h1>Switch</h1>
        <p>The thumb springs between states; the whole 44px+ row is tappable.</p>
      </div>
      <section className="pg-section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Switch label="Uncontrolled with defaultChecked" defaultChecked />
          <Controlled />
          <Switch label="variant=&quot;success&quot;" variant="success" defaultChecked />
          <Switch label="variant=&quot;danger&quot;" variant="danger" defaultChecked />
          <Switch label="Disabled" disabled />
          <Switch label="Dark mode (try me)" />
          <Switch />
        </div>
      </section>
    </ToastProvider>
  )
}
