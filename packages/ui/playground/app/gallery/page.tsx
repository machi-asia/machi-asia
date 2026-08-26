'use client'

import { Gallery } from '@machi-asia/ui'
import type { GalleryItem } from '@machi-asia/ui'

function svgUri(colors: [string, string], label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="310" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="rgba(255,255,255,.9)" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const ITEMS: GalleryItem[] = [
  { id: 'aurora', src: svgUri(['#6366f1', '#a855f7'], 'Aurora'), title: 'Aurora', subtitle: 'Gradient study 01' },
  { id: 'ember', src: svgUri(['#f97316', '#ef4444'], 'Ember'), title: 'Ember', subtitle: 'Gradient study 02' },
  { id: 'lagoon', src: svgUri(['#06b6d4', '#3b82f6'], 'Lagoon'), title: 'Lagoon', subtitle: 'Gradient study 03' },
  { id: 'moss', src: svgUri(['#22c55e', '#84cc16'], 'Moss'), title: 'Moss', subtitle: 'Gradient study 04' },
  { id: 'dusk', src: svgUri(['#8b5cf6', '#ec4899'], 'Dusk'), title: 'Dusk', subtitle: 'Gradient study 05' },
  { id: 'sand', src: svgUri(['#eab308', '#f97316'], 'Sand'), title: 'Sand', subtitle: 'Gradient study 06' },
]

export default function GalleryPage() {
  return (
    <>
      <div className="pg-hero">
        <h1>Gallery</h1>
        <p>Grid and list layouts with hover zoom. Click any image to open the lightbox (arrow keys navigate, Escape closes).</p>
      </div>

      <section className="pg-section">
        <h2>variant=&quot;card&quot; · grid</h2>
        <Gallery items={ITEMS} />
      </section>

      <section className="pg-section">
        <h2>variant=&quot;overlay&quot; · captions slide up on hover</h2>
        <Gallery items={ITEMS.slice(0, 4)} variant="overlay" aspectRatio="16 / 10" columns={2} />
      </section>

      <section className="pg-section">
        <h2>layout=&quot;list&quot;</h2>
        <Gallery items={ITEMS.slice(0, 4)} layout="list" variant="plain" enableLightbox={false} aspectRatio="1 / 1" />
      </section>

      <section className="pg-section">
        <h2>variant=&quot;plain&quot; · lightbox disabled</h2>
        <Gallery items={ITEMS.slice(0, 3)} variant="plain" columns={3} enableLightbox={false} />
      </section>
    </>
  )
}
