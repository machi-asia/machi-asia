import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScrollRotateProps } from './ScrollRotate'
import { ScrollRotate } from './ScrollRotate'

function setup(props: Partial<ScrollRotateProps> = {}) {
  return render(
    <ScrollRotate {...props}>
      <div>Spinning badge</div>
    </ScrollRotate>,
  )
}

describe('ScrollRotate', () => {
  it('pins the section and renders the content inside', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-rotate]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section).toContainHTML('Spinning badge')
    expect(section.style.height).toBe('200vh')
  })

  it('exposes the rotation angle as a custom property', () => {
    const content = setup({ angle: 360 }).container.querySelector(
      '[data-mui-scroll-rotate] > div > div',
    ) as HTMLElement
    expect(content.style.getPropertyValue('--mui-rotate-angle')).toBe('360deg')
  })

  it('allows negative angles for reverse spins', () => {
    const content = setup({ angle: -90 }).container.querySelector(
      '[data-mui-scroll-rotate] > div > div',
    ) as HTMLElement
    expect(content.style.getPropertyValue('--mui-rotate-angle')).toBe('-90deg')
  })

  it('writes scroll progress after mount and merges className', () => {
    const { container } = setup({ className: 'spinner' })
    const section = container.querySelector('[data-mui-scroll-rotate]') as HTMLElement
    expect(section.style.getPropertyValue('--mui-progress')).not.toBe('')
    expect(section.className).toContain('spinner')
  })
})
