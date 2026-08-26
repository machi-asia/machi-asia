import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScrollDepthProps } from './ScrollDepth'
import { ScrollDepth } from './ScrollDepth'

function setup(props: Partial<ScrollDepthProps> = {}, count = 3) {
  return render(
    <ScrollDepth {...props}>
      <section>Tunnel layer one</section>
      <section>Tunnel layer two</section>
      {Array.from({ length: count - 2 }, (_, i) => (
        <section key={i}>Tunnel layer extra {i + 3}</section>
      ))}
    </ScrollDepth>,
  )
}

describe('ScrollDepth', () => {
  it('stacks every child as a perspective layer inside the pinned viewport', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-depth]') as HTMLElement
    expect(section).not.toBeNull()
    const viewport = section.firstElementChild as HTMLElement
    expect(viewport.children).toHaveLength(3)
    expect(viewport.children[0]).toContainHTML('Tunnel layer one')
  })

  it('offsets each layer so they arrive one after another', () => {
    const { container } = setup()
    const layers = (container.querySelector('[data-mui-scroll-depth]') as HTMLElement)
      .firstElementChild!.children as HTMLCollectionOf<HTMLElement>
    expect(layers[0].style.getPropertyValue('--mui-layer-start')).toBe('0.0000')
    const first = Number.parseFloat(layers[0].style.getPropertyValue('--mui-layer-start'))
    const second = Number.parseFloat(layers[1].style.getPropertyValue('--mui-layer-start'))
    const third = Number.parseFloat(layers[2].style.getPropertyValue('--mui-layer-start'))
    expect(second).toBeGreaterThan(first)
    expect(third).toBeGreaterThan(second)
    expect(third).toBeLessThanOrEqual(1)
  })

  it('derives the pin length from the layer count', () => {
    const { container } = setup({}, 4)
    const section = container.querySelector('[data-mui-scroll-depth]') as HTMLElement
    expect(section.style.height).toBe('200vh')
  })

  it('honours an explicit length override', () => {
    const { container } = setup({ length: 5 }, 2)
    const section = container.querySelector('[data-mui-scroll-depth]') as HTMLElement
    expect(section.style.height).toBe('500vh')
  })

  it('writes scroll progress after mount and merges className', () => {
    const { container } = setup({ className: 'tunnel' })
    const section = container.querySelector('[data-mui-scroll-depth]') as HTMLElement
    const raw = section.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
    expect(section.className).toContain('tunnel')
  })
})
