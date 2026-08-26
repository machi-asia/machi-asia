import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Card, CardBody, CardFooter, CardHeader } from './Card'

describe('Card', () => {
  it('renders children inside a div', () => {
    render(
      <Card data-testid="card">
        <p>Hello card</p>
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(card.tagName).toBe('DIV')
    expect(screen.getByText('Hello card')).toBeInTheDocument()
  })

  it('applies distinct variant and hoverable classes', () => {
    const { container, rerender } = render(<Card variant="glass">x</Card>)
    const rootClass = () => (container.firstElementChild as HTMLElement).className
    const glass = rootClass()
    expect(glass.split(' ').length).toBeGreaterThanOrEqual(2)
    rerender(<Card variant="outline">x</Card>)
    expect(rootClass()).not.toBe(glass)
    rerender(<Card hoverable>x</Card>)
    expect(rootClass().split(' ').length).toBeGreaterThan(2)
  })

  it('forwards the ref to the card element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref}>x</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders header title, subtitle and action slots', () => {
    render(
      <Card>
        <CardHeader title="Title" subtitle="Sub" action={<button type="button">Act</button>} />
        <CardBody>Body content</CardBody>
        <CardFooter>Foot</CardFooter>
      </Card>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Sub')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Foot')).toBeInTheDocument()
  })

  it('passes arbitrary HTML attributes through to the root', () => {
    render(<Card aria-label="Featured">c</Card>)
    expect(screen.getByLabelText('Featured')).toBeInTheDocument()
  })
})
