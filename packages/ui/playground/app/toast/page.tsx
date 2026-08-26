'use client'

import { Button, ToastProvider, useToast } from '@machi-asia/ui'

const VARIANTS = [
  ['info', 'Heads up', 'You have 3 new messages waiting.'],
  ['success', 'Saved!', 'Your changes have been stored.'],
  ['warning', 'Storage almost full', 'Less than 500 MB remaining.'],
  ['error', 'Upload failed', 'The file exceeded the size limit.'],
] as const

function ToastButtons() {
  const toast = useToast()
  return (
    <>
      {VARIANTS.map(([variant, title, description]) => (
        <Button
          key={variant}
          variant={variant === 'error' ? 'danger' : variant === 'info' ? 'secondary' : 'ghost'}
          onClick={() => toast.show({ title, description, variant })}
        >
          {variant.charAt(0).toUpperCase() + variant.slice(1)} toast
        </Button>
      ))}
      <Button
        onClick={() => {
          const id = toast.show({ title: 'Sticky toast', description: 'duration=0 means no auto-dismiss. Dismiss manually.', duration: 0 })
          setTimeout(() => toast.dismiss(id), 6000)
        }}
      >
        Sticky toast
      </Button>
    </>
  )
}

export default function ToastPage() {
  return (
    <ToastProvider>
      <div className="pg-hero">
        <h1>Toast</h1>
        <p>Toasts slide up with a spring curve and auto-dismiss after 4s. Bottom-right on desktop, bottom-center on mobile.</p>
      </div>
      <section className="pg-section">
        <h2>Variants</h2>
        <div className="pg-row" style={{ marginTop: 14 }}>
          <ToastButtons />
        </div>
      </section>
      <section className="pg-section">
        <h2>Stacking</h2>
        <div className="pg-row">
          <Stacker />
        </div>
      </section>
    </ToastProvider>
  )
}

function Stacker() {
  const toast = useToast()
  return (
    <Button
      variant="secondary"
      onClick={() => {
        for (let i = 1; i <= 3; i++) {
          setTimeout(() => toast.show({ title: `Notification #${i}`, variant: 'info' }), i * 250)
        }
      }}
    >
      Fire three toasts
    </Button>
  )
}
