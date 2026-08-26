import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Gallery } from './Gallery'
import type { GalleryItem } from './Gallery'

const items: GalleryItem[] = [
  { id: 'one', src: '/a.jpg', alt: 'First', title: 'First title', subtitle: 'sub one' },
  { id: 'two', src: '/b.jpg', alt: 'Second' },
]

describe('Gallery', () => {
  it('renders an image for every item with alt text', () => {
    render(<Gallery items={items} />)
    expect(screen.getByAltText('First')).toHaveAttribute('src', '/a.jpg')
    expect(screen.getByAltText('Second')).toHaveAttribute('src', '/b.jpg')
  })

  it('shows titles and subtitles in card mode', () => {
    render(<Gallery items={items} />)
    expect(screen.getByText('First title')).toBeInTheDocument()
    expect(screen.getByText('sub one')).toBeInTheDocument()
  })

  it('opens a lightbox dialog on item click showing the clicked image', async () => {
    render(<Gallery items={items} enableLightbox />)
    fireEvent.click(screen.getByAltText('Second'))
    const viewer = await screen.findByRole('dialog', { name: 'Image viewer' })
    expect(document.body).toContainElement(viewer)
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('does not open a lightbox when enableLightbox is false', () => {
    render(<Gallery items={items} enableLightbox={false} />)
    fireEvent.click(screen.getByAltText('First'))
    expect(screen.queryByRole('dialog', { name: 'Image viewer' })).not.toBeInTheDocument()
  })

  it('navigates the lightbox with arrows and wraps around', async () => {
    render(<Gallery items={items} enableLightbox />)
    fireEvent.click(screen.getByAltText('First'))
    const viewer = await screen.findByRole('dialog', { name: 'Image viewer' })
    expect(within(viewer).getByText('1 / 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    expect(within(viewer).getByText('2 / 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
    expect(within(viewer).getByText('1 / 2')).toBeInTheDocument()
    expect(within(viewer).getByAltText('First')).toBeInTheDocument()
  })

  it('closes via the close button after the exit transition', async () => {
    render(<Gallery items={items} enableLightbox />)
    fireEvent.click(screen.getByAltText('First'))
    await screen.findByRole('dialog', { name: 'Image viewer' })
    fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }))
    await waitFor(
      () => expect(screen.queryByRole('dialog', { name: 'Image viewer' })).not.toBeInTheDocument(),
      { timeout: 1000 },
    )
  })

  it('closes on Escape', async () => {
    render(<Gallery items={items} enableLightbox />)
    fireEvent.click(screen.getByAltText('Second'))
    await screen.findByRole('dialog', { name: 'Image viewer' })
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Image viewer' })).not.toBeInTheDocument(),
    )
  })
})
