import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from './Footer'

const links = [
  { label: 'Docs', href: '/docs' },
  { label: 'Support', href: '/support' },
  { label: 'Privacy', href: '/privacy' },
]

describe('Footer', () => {
  it('renders as a contentinfo landmark with links', () => {
    render(<Footer links={links} />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })

  it('renders an optional brand node', () => {
    render(<Footer brand={<span>Machi</span>} links={links} />)
    expect(screen.getByText('Machi')).toBeInTheDocument()
  })

  it('renders nothing extra when brand is omitted', () => {
    const { container } = render(<Footer links={links} />)
    expect(container.querySelectorAll('a')).toHaveLength(links.length)
  })

  it('renders the note row with copyright content', () => {
    render(<Footer links={links} note={<>© 2026 Machi</>} />)
    expect(screen.getByText(/© 2026 Machi/)).toBeInTheDocument()
    expect(screen.getByText(/© 2026 Machi/).parentElement).not.toBeNull()
  })

  it('supports transparent variant and free-form children', () => {
    const { container } = render(
      <Footer variant="transparent" brand="Machi">
        <p>Built by Machi</p>
      </Footer>,
    )
    expect(container.querySelector('footer')?.className).toMatch(/transparent/)
    expect(screen.getByText('Built by Machi')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
