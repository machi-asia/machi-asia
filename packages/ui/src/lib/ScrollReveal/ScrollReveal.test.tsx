import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ScrollRevealProps } from './ScrollReveal'
import { ScrollReveal } from './ScrollReveal'

const VH = 768
const ENTER_WINDOW = 0.45

function setup(props: Partial<ScrollRevealProps> = {}) {
  return render(
    <ScrollReveal {...props}>
      <p>Section content</p>
    </ScrollReveal>,
  )
}

function mockRect(el: HTMLElement, top: number, height: number) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    height,
    left: 0,
    right: 320,
    width: 320,
    bottom: top + height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect)
}

async function scrollTo(top: number, height: number, el: HTMLElement) {
  mockRect(el, top, height)
  await act(async () => {
    window.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })
}

function expectedProgress(top: number, height: number) {
  const entered = Math.max(VH - top, 0)
  let progress = entered / (VH * ENTER_WINDOW)
  if (height > 0) progress = Math.max(progress, entered / height)
  return Math.min(Math.max(progress, 0), 1)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollReveal', () => {
  it('marks the section and interpolates from scroll progress', async () => {
    const { container } = setup({ variant: 'wipe' })
    const el = container.firstElementChild as HTMLElement
    expect(el).toHaveAttribute('data-mui-scroll-reveal')
    expect(el.getAttribute('data-mui-reveal-variant')).toBe('wipe')
    expect(el).toContainHTML('Section content')
    const raw = el.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
  })

  it('scrubs progress with scroll position', async () => {
    const { container } = setup()
    const el = container.firstElementChild as HTMLElement

    await scrollTo(700, 200, el)
    expect(el.style.getPropertyValue('--mui-progress')).toBe(expectedProgress(700, 200).toFixed(4))

    await scrollTo(500, 200, el)
    expect(el.style.getPropertyValue('--mui-progress')).toBe(expectedProgress(500, 200).toFixed(4))
  })

  it('completes once the section is fully inside the viewport, even at the end of the page', async () => {
    const { container } = setup()
    const el = container.firstElementChild as HTMLElement

    // Short section whose top can never reach the reveal finish line.
    await scrollTo(600, 150, el)
    expect(el.style.getPropertyValue('--mui-progress')).toBe('1.0000')
  })

  it('clamps progress when the section has travelled past the viewport top', async () => {
    const { container } = setup()
    const el = container.firstElementChild as HTMLElement

    await scrollTo(-120, 300, el)
    expect(el.style.getPropertyValue('--mui-progress')).toBe('1.0000')
  })

  it('merges className and passes through native attributes', async () => {
    const { container } = setup({ className: 'my-section', id: 'intro' })
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('my-section')
    expect(el.id).toBe('intro')
  })
})
