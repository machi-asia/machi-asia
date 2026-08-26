import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScrollZoomProps } from './ScrollZoom'
import { ScrollZoom } from './ScrollZoom'

function setup(props: Partial<ScrollZoomProps> = {}) {
  return render(
    <ScrollZoom {...props}>
      <section>Zoom content</section>
    </ScrollZoom>,
  )
}

describe('ScrollZoom', () => {
  it('pins a full-height viewport around the zooming content', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-zoom]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.style.height).toBe('200vh')
    const viewport = section.firstElementChild as HTMLElement
    expect(viewport.firstElementChild).toContainHTML('Zoom content')
  })

  it('honours a custom pin length', () => {
    const { container } = setup({ length: 3.5 })
    const section = container.querySelector('[data-mui-scroll-zoom]') as HTMLElement
    expect(section.style.height).toBe('350vh')
  })

  it('defaults to zoom-out and exposes the mode', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-zoom]') as HTMLElement
    expect(section.getAttribute('data-mui-zoom-mode')).toBe('zoom-out')
    const content = section.firstElementChild?.firstElementChild as HTMLElement
    expect(content.className).toContain('zoomOut')
  })

  it('supports zoom-in mode', () => {
    const { container } = setup({ mode: 'zoom-in' })
    const section = container.querySelector('[data-mui-scroll-zoom]') as HTMLElement
    expect(section.getAttribute('data-mui-zoom-mode')).toBe('zoom-in')
    const content = section.firstElementChild?.firstElementChild as HTMLElement
    expect(content.className).toContain('zoomIn')
  })

  it('writes scroll progress after mount and merges className', () => {
    const { container } = setup({ className: 'hero' })
    const section = container.querySelector('[data-mui-scroll-zoom]') as HTMLElement
    const raw = section.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
    expect(section.className).toContain('hero')
  })
})
