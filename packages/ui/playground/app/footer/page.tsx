'use client'

import { Footer } from '@machi-asia/ui'

const productLinks = [
  { label: 'Docs', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Status', href: '#' },
]

export default function FooterPage() {
  return (
    <>
      <div className="pg-hero">
        <h1>Footer</h1>
        <p>
          Wide footer band: optional brand/logo on the left, link row pushed to the right (wraps under 640px), and an
          optional separated note bar for copyright.
        </p>
      </div>

      <Footer brand="Machi" links={productLinks} note={<>© 2026 Machi. All rights reserved.</>} />

      <div style={{ height: 20 }} />

      <Footer
        brand={
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
              stroke="var(--mui-primary)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M12 22V12m0 0L3 7m9 5 9-5" stroke="var(--mui-primary)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        }
        links={[
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
          { label: 'Cookies', href: '#' },
        ]}
        note={
          <>
            <span>Built with @machi-asia/ui</span>
            <span>Made in the playground</span>
          </>
        }
      />

      <div style={{ height: 20 }} />

      <Footer variant="transparent" />

      <section className="pg-section" style={{ marginTop: 20 }}>
        <h2>Notes</h2>
        <ul style={{ color: 'var(--mui-text-muted)', lineHeight: 1.7 }}>
          <li>The brand slot accepts any node — text, an image logo, or custom markup.</li>
          <li>Pass children for free-form content between brand and links (e.g. a newsletter form).</li>
          <li>Omit everything for a bare transparent spacer footer.</li>
        </ul>
      </section>
    </>
  )
}
