import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScrollSplitProps } from './ScrollSplit'
import { ScrollSplit } from './ScrollSplit'

function setup(props: Partial<ScrollSplitProps> = {}) {
  return render(
    <ScrollSplit {...props}>
      <section>Doors opening</section>
    </ScrollSplit>,
  )
}

describe('ScrollSplit', () => {
  it('covers the pinned content with two decorative panels', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-split]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section).toContainHTML('Doors opening')
    const panelsWrapper = section.querySelector('[data-mui-panel-a]')?.parentElement as HTMLElement
    expect(panelsWrapper).toHaveAttribute('aria-hidden', 'true')
    expect(panelsWrapper.children).toHaveLength(2)
  })

  it('renders provided elements on the door panels themselves', () => {
    const { container } = setup({
      panelA: <span>Left door</span>,
      panelB: <span>Right door</span>,
      panelClassName: 'door',
    })
    const section = container.querySelector('[data-mui-scroll-split]') as HTMLElement
    const panelA = section.querySelector('[data-mui-panel-a]') as HTMLElement
    const panelB = section.querySelector('[data-mui-panel-b]') as HTMLElement
    expect(panelA).toContainHTML('Left door')
    expect(panelB).toContainHTML('Right door')
    expect(panelA.className).toContain('door')
    expect(panelB.className).toContain('door')
    expect(panelA.parentElement).not.toHaveAttribute('aria-hidden')
  })

  it('defaults to horizontal and honours vertical', () => {
    const horizontal = setup().container.querySelector('[data-mui-scroll-split]') as HTMLElement
    expect(horizontal.getAttribute('data-mui-split-direction')).toBe('horizontal')

    const vertical = setup({ direction: 'vertical' }).container.querySelector(
      '[data-mui-scroll-split]',
    ) as HTMLElement
    expect(vertical.getAttribute('data-mui-split-direction')).toBe('vertical')
  })

  it('sizes the pin from the length prop', () => {
    const { container } = setup({ length: 4 })
    const section = container.querySelector('[data-mui-scroll-split]') as HTMLElement
    expect(section.style.height).toBe('400vh')
  })

  it('writes scroll progress after mount and merges className', () => {
    const { container } = setup({ className: 'vault' })
    const section = container.querySelector('[data-mui-scroll-split]') as HTMLElement
    expect(section.style.getPropertyValue('--mui-progress')).not.toBe('')
    expect(section.className).toContain('vault')
  })
})
