import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollHorizontal } from './ScrollHorizontal'

function setup(props: Record<string, unknown> = {}, count = 3) {
  return render(
    <ScrollHorizontal {...props}>
      <section>Slide one</section>
      <section>Slide two</section>
      {Array.from({ length: count - 2 }, (_, i) => (
        <section key={i}>Slide extra {i + 3}</section>
      ))}
    </ScrollHorizontal>,
  )
}

describe('ScrollHorizontal', () => {
  it('pins a viewport and lays all children out as horizontal slides', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-horizontal]') as HTMLElement
    expect(section).not.toBeNull()
    const track = section.querySelector(':scope > div > div') as HTMLElement
    const slides = track.children
    expect(slides).toHaveLength(3)
    expect(slides[0]).toContainHTML('Slide one')
  })

  it('sizes the outer section and track from the slide count', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-horizontal]') as HTMLElement
    expect(section.style.height).toBe('300vh')
    const track = section.querySelector(':scope > div > div') as HTMLElement
    expect(track.style.width).toBe('300%')
  })

  it('writes scroll progress onto the section after mount', () => {
    const { container } = setup()
    const section = container.querySelector('[data-mui-scroll-horizontal]') as HTMLElement
    const raw = section.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
  })

  it('handles a single child without division issues', () => {
    const { container } = render(
      <ScrollHorizontal>
        <section>Only slide</section>
      </ScrollHorizontal>,
    )
    const section = container.querySelector('[data-mui-scroll-horizontal]') as HTMLElement
    expect(section.style.height).toBe('100vh')
    const track = section.querySelector(':scope > div > div') as HTMLElement
    expect(track.style.width).toBe('100%')
    expect(track.style.getPropertyValue('--mui-track-shift')).toBe('0%')
  })

  it('merges className onto the outer section', () => {
    const { container } = setup({ className: 'my-strip' })
    expect(container.firstElementChild?.className).toContain('my-strip')
  })
})
