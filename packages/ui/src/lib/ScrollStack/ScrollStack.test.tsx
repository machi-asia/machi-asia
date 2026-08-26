import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollStack } from './ScrollStack'

function setup(props: Record<string, unknown> = {}, count = 3) {
  return render(
    <ScrollStack {...props}>
      <section>Deck card one</section>
      <section>Deck card two</section>
      {Array.from({ length: count - 2 }, (_, i) => (
        <section key={i}>Deck card extra {i + 3}</section>
      ))}
    </ScrollStack>,
  )
}

describe('ScrollStack', () => {
  it('wraps every child in a sticky pull-back layer', () => {
    const { container } = setup()
    const stack = container.querySelector('[data-mui-scroll-stack]') as HTMLElement
    expect(stack).not.toBeNull()
    const layers = stack.querySelectorAll('[data-mui-stack-layer]')
    expect(layers).toHaveLength(3)
    const cards = stack.querySelectorAll('[data-mui-stack-card]')
    expect(cards).toHaveLength(3)
    expect(cards[0]).toContainHTML('Deck card one')
  })

  it('pins every card inside one shared sticky container', () => {
    const { container } = setup()
    const stack = container.querySelector('[data-mui-scroll-stack]') as HTMLElement
    const layers = Array.from(stack.children) as HTMLElement[]
    expect(layers.length).toBeGreaterThan(1)
    layers.forEach((layer) => {
      expect(layer.className).toBeTruthy()
      expect(layer.style.height).toBe('100vh')
    })
  })

  it('writes cumulative depth and cover progress on every covered card after mount', () => {
    const { container } = setup()
    const cards = container.querySelectorAll<HTMLElement>('[data-mui-stack-card]')
    const depths: number[] = []
    for (let i = 0; i < cards.length - 1; i++) {
      const depthRaw = cards[i].style.getPropertyValue('--mui-depth')
      const coverRaw = cards[i].style.getPropertyValue('--mui-cover')
      expect(depthRaw).not.toBe('')
      expect(coverRaw).not.toBe('')
      const depth = Number.parseFloat(depthRaw)
      depths.push(depth)
      expect(depth).toBeGreaterThanOrEqual(0)
      expect(depth).toBeLessThanOrEqual(3)
      const cover = Number.parseFloat(coverRaw)
      expect(cover).toBeGreaterThanOrEqual(0)
      expect(cover).toBeLessThanOrEqual(1)
    }
    expect(cards[cards.length - 1].style.getPropertyValue('--mui-depth')).toBe('')
    expect(cards[cards.length - 1].style.getPropertyValue('--mui-cover')).toBe('')
  })

  it('exposes scale and dim tuning as CSS custom properties on the container', () => {
    const { container } = setup({ scaleAmount: 0.12, dimAmount: 0.5 })
    const stack = container.querySelector('[data-mui-scroll-stack]') as HTMLElement
    expect(stack.style.getPropertyValue('--mui-stack-scale')).toBe('0.12')
    expect(stack.style.getPropertyValue('--mui-stack-dim')).toBe('0.5')
  })

  it('applies the configured item height to each layer', () => {
    const { container } = setup({ itemHeight: '70vh' })
    const layers = container.querySelectorAll<HTMLElement>('[data-mui-stack-layer]')
    expect(layers[0].style.height).toBe('70vh')
  })

  it('merges className onto the container', () => {
    const { container } = setup({ className: 'my-deck' })
    expect(container.firstElementChild?.className).toContain('my-deck')
  })
})
