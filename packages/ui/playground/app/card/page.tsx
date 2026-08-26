'use client'

import { Card, CardBody, CardFooter, CardHeader, Button } from '@machi-asia/ui'

const VARIANTS = [
  ['elevated', 'Default. Soft shadow with a hairline border.'],
  ['outline', 'Transparent background with a strong outline.'],
  ['filled', 'Tinted surface, no border.'],
  ['glass', 'Frosted-glass blur that shines in dark mode.'],
] as const

export default function CardPage() {
  return (
    <>
      <div className="pg-hero">
        <h1>Card</h1>
        <p>Four visual variants, optional hover lift (skipped on touch devices), composable header/body/footer.</p>
      </div>

      <section className="pg-section">
        <h2>Variants</h2>
        <p className="pg-hint">The kind of card is chosen via the variant prop.</p>
        <div className="pg-grid" style={{ marginTop: 16 }}>
          {VARIANTS.map(([variant, description]) => (
            <Card key={variant} variant={variant} hoverable>
              <CardHeader title={variant} />
              <CardBody>{description}</CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="pg-section">
        <h2>Composed card</h2>
        <div className="pg-grid" style={{ marginTop: 16 }}>
          <Card hoverable>
            <CardHeader title="Getting started" subtitle="Header, body and footer slots" />
            <CardBody>Cards compose from Card, CardHeader, CardBody and CardFooter.</CardBody>
            <CardFooter>
              <Button size="sm">Action</Button>
              <Button size="sm" variant="ghost">
                Learn more
              </Button>
            </CardFooter>
          </Card>
          <Card hoverable padding="none">
            <div style={{ height: 110, background: 'linear-gradient(120deg,#6366f1,#a855f7)' }} />
            <div style={{ padding: 18 }}>
              <strong>Cover image card</strong>
              <p style={{ color: 'var(--mui-text-muted)', fontSize: '.9rem' }}>
                padding=&quot;none&quot; lets you build media cards.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}
