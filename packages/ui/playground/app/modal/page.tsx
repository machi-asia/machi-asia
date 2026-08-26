'use client'

import { useState } from 'react'
import { Button, Modal } from '@machi-asia/ui'

export default function ModalPage() {
  const [open, setOpen] = useState<'sm' | 'md' | 'lg' | null>(null)

  const close = () => setOpen(null)

  return (
    <>
      <div className="pg-hero">
        <h1>Modal</h1>
        <p>Fades + scales in on desktop; slides up as a bottom sheet under 640px. Focus is trapped and restored.</p>
      </div>
      <section className="pg-section">
        <h2>Sizes</h2>
        <div className="pg-row">
          <Button onClick={() => setOpen('sm')}>Open small</Button>
          <Button variant="secondary" onClick={() => setOpen('md')}>
            Open medium
          </Button>
          <Button variant="ghost" onClick={() => setOpen('lg')}>
            Open large
          </Button>
        </div>
      </section>

      <Modal
        open={open != null}
        onClose={close}
        size={open ?? 'md'}
        title={`A ${open ?? ''} modal`}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Looks good</Button>
          </>
        }
      >
        <p>Try: Escape to close, click the backdrop, Tab through the focusables — focus never leaves the dialog.</p>
        <p>On a phone-sized viewport this panel docks to the bottom like an iOS sheet.</p>
        <Button fullWidth variant="secondary">
          Focusable element
        </Button>
      </Modal>
    </>
  )
}
