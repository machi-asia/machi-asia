'use client'

import { Accordion, AccordionItem } from '@machi-asia/ui'

export default function AccordionPage() {
  return (
    <>
      <div className="pg-hero">
        <h1>Accordion</h1>
        <p>Height animates via grid rows — no magic pixel measuring. Chevron springs on toggle.</p>
      </div>
      <section className="pg-section">
        <h2>Variants</h2>
        <div style={{ display: 'grid', gap: 26 }}>
          {(['separated', 'boxed', 'flush'] as const).map((variant) => (
            <div key={variant}>
              <p style={{ margin: '0 0 8px', color: 'var(--mui-text-muted)', fontSize: '.85rem' }}>variant=&quot;{variant}&quot;</p>
              <Accordion variant={variant} defaultOpen={[]}>
                <AccordionItem header="First item">Content for the first item.</AccordionItem>
                <AccordionItem header="Second item">Content for the second item.</AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>
      </section>
      <section className="pg-section">
        <h2>Single mode (default)</h2>
        <Accordion defaultOpen={[]}>
          <AccordionItem header="How does the animation work?">
            The panel is a CSS grid whose rows transition between 0fr and 1fr, giving a smooth height animation without JavaScript measurements.
          </AccordionItem>
          <AccordionItem header="Can it be disabled?">
            Yes, set disabled on an AccordionItem.
          </AccordionItem>
          <AccordionItem header="Accessibility">
            Headers are real buttons with aria-expanded and aria-controls; panels have role=region.
          </AccordionItem>
        </Accordion>
      </section>
      <section className="pg-section">
        <h2>Multiple open + pre-expanded</h2>
        <Accordion allowMultiple defaultOpen={['first']}>
          <AccordionItem header="First item" disabled={false}>
            This one starts open via defaultOpen.
          </AccordionItem>
          <AccordionItem header="Second item">Several items can stay open at once with allowMultiple.</AccordionItem>
          <AccordionItem header="Third item" disabled>
            Disabled items cannot be toggled.
          </AccordionItem>
        </Accordion>
      </section>
    </>
  )
}
