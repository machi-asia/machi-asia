import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Parallax } from './Parallax'

function setup(props: Record<string, unknown> = {}) {
  return render(
    <Parallax {...props}>
      <p>Drifting content</p>
    </Parallax>,
  )
}

describe('Parallax', () => {
  it('renders content through an inner transformed layer', () => {
    const { container } = setup()
    const wrapper = container.querySelector('[data-mui-parallax]') as HTMLElement
    expect(wrapper).not.toBeNull()
    const inner = wrapper.firstElementChild as HTMLElement
    expect(inner).toContainHTML('Drifting content')
  })

  it('exposes the configured speed as a CSS custom property', () => {
    const { container } = setup({ speed: 0.45 })
    const wrapper = container.querySelector('[data-mui-parallax]') as HTMLElement
    expect(wrapper.style.getPropertyValue('--mui-parallax-speed')).toBe('0.45')
  })

  it('defaults to a subtle background-depth drift', () => {
    const { container } = setup()
    const wrapper = container.querySelector('[data-mui-parallax]') as HTMLElement
    expect(wrapper.style.getPropertyValue('--mui-parallax-speed')).toBe('-0.2')
  })

  it('receives scroll progress after mount', () => {
    const { container } = setup()
    const wrapper = container.querySelector('[data-mui-parallax]') as HTMLElement
    const raw = wrapper.style.getPropertyValue('--mui-progress')
    expect(raw).not.toBe('')
    expect(Number.parseFloat(raw)).toBeGreaterThanOrEqual(0)
    expect(Number.parseFloat(raw)).toBeLessThanOrEqual(1)
  })

  it('merges className and passes through native attributes', () => {
    const { container } = setup({ className: 'bg-layer', id: 'hero-bg' })
    const wrapper = container.querySelector('[data-mui-parallax]') as HTMLElement
    expect(wrapper.className).toContain('bg-layer')
    expect(wrapper.id).toBe('hero-bg')
  })
})
