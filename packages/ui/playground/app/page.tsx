'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Accordion,
  AccordionItem,
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  Dropdown,
  Modal,
  Navbar,
  Switch,
  Tabs,
  ToastProvider,
  useToast,
} from '@machi-asia/ui'

const LINKS = [
  ['/button', 'Buttons — variants, sizes, loading'],
  ['/card', 'Cards — elevated/outline/filled/glass'],
  ['/calendar', 'Calendar — month nav, min/max dates'],
  ['/dropdown', 'Dropdown — keyboard + touch'],
  ['/accordion', 'Accordion — single/multi expand'],
  ['/navbar', 'Navbar — shrink to see the drawer'],
  ['/footer', 'Footer — wide band, brand + links'],
  ['/modal', 'Modal — bottom sheet on mobile'],
  ['/tabs', 'Tabs — sliding indicator'],
  ['/switch', 'Switch — animated toggle'],
  ['/toast', 'Toast — slide-in notifications'],
  ['/table', 'Table — sortable, sticky, responsive'],
  ['/text-editor', 'Text editor — rich text toolbar'],
  ['/gallery', 'Gallery — grid/list + lightbox'],
  ['/scroll-effects', 'Scroll transitions — reveal, stack, horizontal, parallax'],
] as const

function DemoToaster() {
  const toast = useToast()
  return (
    <Button variant="secondary" onClick={() => toast.show({ title: 'Hello from Machi UI', variant: 'success', description: 'This is a live toast notification.' })}>
      Show a toast
    </Button>
  )
}

export default function OverviewPage() {
  const [open, setOpen] = useState(false)
  const [navy, setNavy] = useState(false)

  return (
    <ToastProvider>
      <div className="pg-hero">
        <h1>@machi-asia/ui</h1>
        <p>Animated, mobile-friendly React components. Resize the window or open dev-tools device mode to test responsiveness.</p>
      </div>

      <section className="pg-section">
        <h2>All components</h2>
        <p className="pg-hint">Each has a dedicated demo page.</p>
        <div className="pg-grid">
          {LINKS.map(([href, label]) => {
            const name = label.split(' ')[0]
            return (
              <Link key={href} href={href} className="pg-card-link">
                <strong>{name}</strong>
                <span>{label.slice(label.indexOf('—') + 2)}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="pg-section">
        <h2>Quick samples</h2>
        <p className="pg-hint">A taste of everything on one page.</p>
        <div className="pg-row" style={{ marginBottom: 20 }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" loading>
            Saving
          </Button>
          <DemoToaster />
        </div>
        <div className="pg-row" style={{ marginBottom: 20 }}>
          <Dropdown
            options={[
              { value: 'react', label: 'React' },
              { value: 'vue', label: 'Vue' },
              { value: 'svelte', label: 'Svelte', disabled: true },
            ]}
            onChange={() => undefined}
            placeholder="Pick a framework"
          />
          <Switch label="Enable notifications" defaultChecked />
        </div>
        <div style={{ maxWidth: 560 }}>
          <Accordion allowMultiple>
            <AccordionItem header="What is @machi-asia/ui?">
              A library of reusable animated React components, built to be published on npm.
            </AccordionItem>
            <AccordionItem header="Is it mobile friendly?">
              Yes. Touch targets are at least 44px and the navbar collapses into a drawer.
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Navbar
        brand="Sample Nav"
        links={[
          { label: 'Home', href: '#' },
          { label: 'Docs', href: '#' },
          { label: 'Pricing', href: '#' },
        ]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            Open modal
          </Button>
        }
      />
      <div style={{ height: 12 }} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Example modal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
      >
        On desktop this scales in from the center. Under 640px wide it slides up as a bottom sheet.
      </Modal>

      <Card hoverable style={{ maxWidth: 480 }}>
        <CardHeader title="Hoverable card" subtitle="Lifts on pointer devices" />
        <CardBody>Tabs below use a spring-eased sliding indicator.</CardBody>
      </Card>
      <div style={{ height: 16 }} />
      <Tabs
        items={[
          { id: 'a', label: 'Overview', content: 'Sliding underline animates between tabs.' },
          { id: 'b', label: 'Details', content: 'Panels fade in when switched.' },
          { id: 'c', label: 'Reviews', content: 'Arrow keys work too.' },
        ]}
      />

      <Calendar defaultValue={new Date()} />
    </ToastProvider>
  )
}
