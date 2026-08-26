import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScrollCurtainProps } from './ScrollCurtain'
import { ScrollCurtain } from './ScrollCurtain'

function setup(props: Partial<ScrollCurtainProps> = {}) {
  return render(
    <ScrollCurtain {...props}>
      <section>Hidden treasure</section>
    </ScrollCurtain>,
  )
}

describe('ScrollCurtain', () => {
  it('covers the pinned content with a decorative curtain', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-curtain]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section).toContainHTML('Hidden treasure')
    const curtain = section.querySelector('[data-mui-curtain-cover]') as HTMLElement
    expect(curtain).not.toBeNull()
    expect(curtain).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders provided elements on the sliding curtain itself', () => {
    const { container } = setup({
      curtain: <h2>Cover story</h2>,
      curtainClassName: 'my-cover',
    })
    const curtain = container.querySelector('[data-mui-curtain-cover]') as HTMLElement
    expect(curtain).toContainHTML('Cover story')
    expect(curtain).toHaveAttribute('aria-hidden', 'false')
    expect(curtain.className).toContain('my-cover')
  })

  it('defaults to sliding up and honours other directions', () => {
    const up = setup().container.querySelector('[data-mui-scroll-curtain]') as HTMLElement
    expect(up.getAttribute('data-mui-curtain-direction')).toBe('up')

    const left = setup({ direction: 'left' }).container.querySelector(
      '[data-mui-scroll-curtain]',
    ) as HTMLElement
    expect(left.getAttribute('data-mui-curtain-direction')).toBe('left')
  })

  it('sizes the pin from the length prop', () => {
    const { container } = setup({ length: 1.5 })
    const section = container.querySelector('[data-mui-scroll-curtain]') as HTMLElement
    expect(section.style.height).toBe('150vh')
  })

  it('writes scroll progress after mount and merges className', () => {
    const { container } = setup({ className: 'reveal-me' })
    const section = container.querySelector('[data-mui-scroll-curtain]') as HTMLElement
    const raw = section.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
    expect(section.className).toContain('reveal-me')
  })
})
