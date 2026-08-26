'use client'

import type { CSSProperties } from 'react'
import {
  Parallax,
  ScrollCurtain,
  ScrollDepth,
  ScrollHorizontal,
  ScrollReveal,
  ScrollRotate,
  ScrollSplit,
  ScrollStack,
  ScrollZoom,
} from '@machi-asia/ui'
import type { ScrollRevealVariant } from '@machi-asia/ui'

const VARIANTS: Array<[ScrollRevealVariant, string]> = [
  ['fade-up', 'rises into place'],
  ['fade-down', 'drops into place'],
  ['fade-left', 'travels leftward in'],
  ['fade-right', 'travels rightward in'],
  ['zoom-in', 'grows from smaller'],
  ['zoom-out', 'settles from larger'],
  ['blur', 'focuses from a blur'],
  ['wipe', 'wipes across with clip-path'],
  ['rotate', 'tilts upright as it lands'],
  ['flip', 'flips up in 3D'],
]

const STACK_PANELS = [
  ['#6366f1', '#a855f7', 'Card one'],
  ['#f97316', '#ef4444', 'Card two'],
  ['#06b6d4', '#3b82f6', 'Card three'],
] as const

const SLIDES = [
  ['#22c55e', '#84cc16', 'Slide 01'],
  ['#8b5cf6', '#ec4899', 'Slide 02'],
  ['#eab308', '#f97316', 'Slide 03'],
  ['#0ea5e9', '#6366f1', 'Slide 04'],
] as const

function box(bg: string, extra: CSSProperties = {}): CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    minHeight: '38vh',
    padding: '32px',
    borderRadius: '18px',
    background: bg,
    color: '#fff',
    fontSize: 'clamp(1.2rem, 3vw, 2rem)',
    fontWeight: 700,
    textAlign: 'center',
    textShadow: '0 2px 12px rgba(0,0,0,.35)',
    ...extra,
  }
}

function label(variant: string, blurb: string) {
  return (
    <span>
      variant=&quot;{variant}&quot;
      <br />
      <small style={{ fontSize: '.55em', opacity: 0.85 }}>{blurb}</small>
    </span>
  )
}

export default function ScrollEffectsPage() {
  return (
    <>
      <div className="pg-hero">
        <h1>Scroll Transitions</h1>
        <p>
          Sections that react to scrolling instead of just sitting there. Scroll down slowly —
          reveals scrub in per section, the deck pins and pulls back, vertical scroll drives the
          horizontal strip, layers drift at different depths, content zooms away, curtains wipe
          off, badges spin, doors part and a 3D tunnel flies at you. Everything reverses when you
          scroll back up.
        </p>
      </div>

      <section className="pg-section">
        <h2>ScrollReveal · 10 entrance variants</h2>
        <p className="pg-hint">Each panel scrubs in as it enters the viewport and reverses when you scroll back up.</p>
        <div style={{ display: 'grid', gap: '45vh' }}>
          {VARIANTS.map(([variant, blurb], index) => (
            <ScrollReveal key={variant} variant={variant}>
              <div style={box(`linear-gradient(135deg, hsl(${index * 36} 70% 55%), hsl(${index * 36 + 40} 70% 45%))`)}>
                {label(variant, blurb)}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="pg-section">
        <h2>ScrollStack · pinned pull-back deck</h2>
        <p className="pg-hint">
          Cards pin to the top while the next slides over them — each one piles on and pushes
          earlier cards further back.
        </p>
        <ScrollStack itemHeight="80vh">
          {STACK_PANELS.map(([from, to, title]) => (
            <div key={title} style={box(`linear-gradient(160deg, ${from}, ${to})`, { minHeight: '78vh' })}>
              {title}
            </div>
          ))}
        </ScrollStack>
      </section>

      <section className="pg-section">
        <h2>ScrollHorizontal · pinned horizontal scrub</h2>
        <p className="pg-hint">Keep scrolling vertically — the track slides sideways.</p>
        <ScrollHorizontal>
          {SLIDES.map(([from, to, title]) => (
            <div key={title} style={box(`linear-gradient(120deg, ${from}, ${to})`, { minHeight: '96vh', borderRadius: 0 })}>
              {title}
            </div>
          ))}
        </ScrollHorizontal>
      </section>

      <section className="pg-section">
        <h2>Parallax · depth drift</h2>
        <p className="pg-hint">Background recedes while the badge floats forward.</p>
        <div style={{ position: 'relative', overflow: 'hidden', height: '70vh', borderRadius: '18px' }}>
          <Parallax speed={-0.5} style={{ position: 'absolute', inset: '-50% 0' }}>
            <div
              style={{
                height: '100%',
                background: 'radial-gradient(circle at 30% 30%, #a855f7, #4338ca)',
              }}
            />
          </Parallax>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
              fontWeight: 700,
              textShadow: '0 2px 14px rgba(0,0,0,.45)',
            }}
          >
            Foreground holds still
          </div>
          <Parallax speed={0.35} style={{ position: 'absolute', right: '12%', top: '18%' }}>
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,.85)',
                display: 'grid',
                placeItems: 'center',
                color: '#4338ca',
                fontWeight: 700,
              }}
            >
              float
            </div>
          </Parallax>
        </div>
      </section>

      <section className="pg-section">
        <h2>ScrollZoom · recede or rush forward</h2>
        <p className="pg-hint">
          mode=&quot;zoom-out&quot; shrinks the content away; try mode=&quot;zoom-in&quot; for the reverse.
        </p>
        <ScrollZoom length={2}>
          <div style={box('linear-gradient(140deg, #4338ca, #7c3aed)', { minHeight: '72vh' })}>
            Zooms into the distance
          </div>
        </ScrollZoom>
      </section>

      <section className="pg-section">
        <h2>ScrollCurtain · wipe-away cover</h2>
        <p className="pg-hint">
          The panel slides up as you scroll (also down / left / right) — and it can carry your own
          elements via the curtain prop.
        </p>
        <ScrollCurtain
          direction="up"
          length={2}
          curtain={
            <span
              style={{
                fontSize: 'clamp(2rem, 8vw, 5rem)',
                fontWeight: 800,
                color: 'var(--mui-text-color)',
                letterSpacing: '0.08em',
              }}
            >
              MACHI
            </span>
          }
        >
          <div style={box('linear-gradient(140deg, #0891b2, #2563eb)', { minHeight: '96vh', borderRadius: 0 })}>
            Revealed by the curtain
          </div>
        </ScrollCurtain>
      </section>

      <section className="pg-section">
        <h2>ScrollRotate · scroll-driven spin</h2>
        <p className="pg-hint">Content rotates through a configurable angle across the pin.</p>
        <ScrollRotate angle={360} length={2}>
          <div style={box('linear-gradient(140deg, #f97316, #db2777)', { width: '260px', height: '260px', borderRadius: '999px' })}>
            360°
          </div>
        </ScrollRotate>
      </section>

      <section className="pg-section">
        <h2>ScrollSplit · parting doors</h2>
        <p className="pg-hint">
          Two panels slide apart (horizontal or vertical axis) — put your own elements on the
          doors with panelA / panelB.
        </p>
        <ScrollSplit
          direction="horizontal"
          length={2}
          panelA={
            <span
              style={{
                fontSize: 'clamp(1.4rem, 4vw, 2.6rem)',
                fontWeight: 700,
                color: 'var(--mui-text-color)',
              }}
            >
              Push
            </span>
          }
          panelB={
            <span
              style={{
                fontSize: 'clamp(1.4rem, 4vw, 2.6rem)',
                fontWeight: 700,
                color: 'var(--mui-text-color)',
              }}
            >
              Pull
            </span>
          }
        >
          <div style={box('linear-gradient(140deg, #059669, #84cc16)', { minHeight: '96vh', borderRadius: 0 })}>
            The doors open
          </div>
        </ScrollSplit>
      </section>

      <section className="pg-section">
        <h2>ScrollDepth · 3D tunnel</h2>
        <p className="pg-hint">Layers fly from deep background towards you, one after another.</p>
        <ScrollDepth length={4}>
          {SLIDES.map(([from, to, title]) => (
            <div key={title} style={box(`linear-gradient(150deg, ${from}, ${to})`, { width: 'min(520px, 80vw)', height: '60vh', borderRadius: '24px' })}>
              {title}
            </div>
          ))}
        </ScrollDepth>
      </section>
    </>
  )
}
