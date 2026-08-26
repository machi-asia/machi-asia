import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Navbar } from './Navbar'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'About', href: '/about' },
]

describe('Navbar', () => {
  it('renders the brand and all links', () => {
    render(<Navbar brand="Acme" links={links} />)
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('renders action buttons in the actions slot', () => {
    render(<Navbar brand="Acme" links={links} actions={<button type="button">Sign in</button>} />)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('accepts an image or logo node as the brand', () => {
    render(
      <Navbar
        brand={
          <>
            <img src="/logo.svg" alt="Logo" />
            <span>Acme</span>
          </>
        }
        links={links}
      />,
    )
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute('src', '/logo.svg')
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('toggles the mobile drawer with aria-expanded state', () => {
    render(<Navbar brand="Acme" links={links} sticky />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const drawerId = toggle.getAttribute('aria-controls') ?? ''
    expect(document.getElementById(drawerId)).not.toBeNull()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes an open drawer when Escape is pressed', () => {
    render(<Navbar brand="Acme" links={links} />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('exposes a labelled navigation landmark even without links', () => {
    render(<Navbar brand="Solo" links={[]} />)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByText('Solo')).toBeInTheDocument()
  })
})

describe('Navbar primary variant', () => {
  const base = { brand: 'Acme', links }

  it('does not render auth affordances for other variants', () => {
    render(<Navbar {...base} />)
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the auth modal from the sign-in trigger', async () => {
    render(<Navbar {...base} variant="primary" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Email')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Password')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Google' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
  })

  it('passes submitted credentials to onLogin and closes the dialog', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    render(<Navbar {...base} variant="primary" onLogin={onLogin} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'amy@example.com' } })
    fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ email: 'amy@example.com', password: 'secret123' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('routes OAuth providers through onOAuthLogin', async () => {
    const onOAuthLogin = vi.fn().mockResolvedValue(undefined)
    render(<Navbar {...base} variant="primary" onOAuthLogin={onOAuthLogin} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'GitHub' }))
    await waitFor(() => expect(onOAuthLogin).toHaveBeenCalledWith('github'))
  })

  it('surfaces the authError prop inside the dialog', async () => {
    render(<Navbar {...base} variant="primary" authError="Session expired" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Session expired')
  })

  it('shows the signed-in user and signs out from the dropdown menu', () => {
    const onSignOut = vi.fn()
    const { container } = render(
      <Navbar
        {...base}
        variant="primary"
        user={{ email: 'amy@example.com', username: 'amyk', displayName: 'Amy Kim' }}
        onSignOut={onSignOut}
      />,
    )
    const nav = within(container.querySelector('nav')!)
    expect(nav.getByText('Amy Kim')).toBeInTheDocument()
    fireEvent.click(nav.getByRole('button', { name: /Amy Kim/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
  })

  it('falls back to initials when no avatar image is provided', () => {
    const { container } = render(<Navbar {...base} variant="primary" user={{ email: 'amy@example.com', username: 'amyk' }} />)
    expect(within(container.querySelector('nav')!).getByText('AM')).toBeInTheDocument()
  })

  it('renders the drawer and overlay through a portal outside the header', () => {
    const { container } = render(<Navbar {...base} />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(toggle)
    const drawer = document.getElementById(toggle.getAttribute('aria-controls')!)
    expect(drawer).not.toBeNull()
    expect(container.querySelector('header')).not.toContainElement(drawer!)
    expect(document.body).toContainElement(drawer!)
  })

  it('stays consistent under rapid open/close/open toggling', () => {
    render(<Navbar {...base} />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const drawer = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(drawer.className).toMatch(/drawerOpen/)
  })

  it('recovers cleanly from the drawer sign-in modal flow', async () => {
    render(<Navbar {...base} variant="primary" onLogin={vi.fn().mockResolvedValue(undefined)} />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(toggle)
    const drawer = document.getElementById(toggle.getAttribute('aria-controls')!)!
    fireEvent.click(within(drawer).getAllByRole('button', { name: 'Sign in' })[0])
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(document.body.style.overflow).toBe('')
    })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Navbar link alignment', () => {
  const base = { brand: 'Acme', links }

  it('defaults to left alignment', () => {
    const { container } = render(<Navbar {...base} />)
    expect(container.querySelector('ul')?.className).toMatch(/alignLeft/)
  })

  it('centers only the link group, keeping brand first and actions last', () => {
    const { container } = render(
      <Navbar {...base} linkAlign="center" actions={<button type="button">CTA</button>} />,
    )
    const nav = container.querySelector('nav')!
    expect(container.querySelector('ul')?.className).toMatch(/alignCenter/)
    expect(nav.children[0].className).toMatch(/brand/)
    expect(nav.children[nav.children.length - 1].className).toMatch(/hamburger|actions/)
  })

  it('right-aligns the link group when requested', () => {
    const { container } = render(<Navbar {...base} linkAlign="right" />)
    expect(container.querySelector('ul')?.className).toMatch(/alignRight/)
  })
})

describe('Navbar navigation types', () => {
  const navLinks = [
    { label: 'Home', href: '/' },
    {
      label: 'Resources',
      children: [{ label: 'Docs', href: '/docs' }, { label: 'Pricing', targetId: 'pricing' }],
    },
    { label: 'Features', targetId: 'features' },
  ]

  function stubScroll() {
    const scrollTo = vi.fn()
    const originalScrollTo = window.scrollTo
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
    const replaceState = vi.spyOn(window.history, 'replaceState')
    return {
      scrollTo,
      replaceState,
      restore() {
        window.scrollTo = originalScrollTo
        replaceState.mockRestore()
      },
    }
  }

  it('toggles a desktop dropdown menu for items with children', () => {
    render(<Navbar brand="Acme" links={navLinks} />)
    const trigger = screen.getByRole('button', { name: /Resources/ })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: 'Resources' })
    expect(within(menu).getByRole('menuitem', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(menu).getByRole('menuitem', { name: 'Pricing' })).toHaveAttribute('href', '#pricing')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes an open dropdown when Escape is pressed', () => {
    render(<Navbar brand="Acme" links={navLinks} />)
    fireEvent.click(screen.getByRole('button', { name: /Resources/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes an open dropdown on pointer down outside the nav', () => {
    render(<Navbar brand="Acme" links={navLinks} />)
    fireEvent.click(screen.getByRole('button', { name: /Resources/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  function mountSection(id: string) {
    const el = document.createElement('section')
    el.id = id
    document.body.appendChild(el)
    return () => el.remove()
  }

  it('smooth-scrolls from dropdown children that reference a section and closes the menu', () => {
    const removeSection = mountSection('pricing')
    const { scrollTo, replaceState, restore } = stubScroll()
    try {
      render(<Navbar brand="Acme" links={navLinks} />)
      fireEvent.click(screen.getByRole('button', { name: /Resources/ }))
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Pricing' }))
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
      expect(replaceState).toHaveBeenCalledWith(null, '', '#pricing')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    } finally {
      restore()
      removeSection()
    }
  })

  it('smooth-scrolls top-level section references to their target element', () => {
    const target = document.createElement('section')
    target.id = 'features'
    document.body.appendChild(target)
    const { scrollTo, replaceState, restore } = stubScroll()
    try {
      render(<Navbar brand="Acme" links={navLinks} />)
      const sectionLink = screen.getByRole('link', { name: 'Features' })
      expect(sectionLink).toHaveAttribute('href', '#features')
      fireEvent.click(sectionLink)
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(replaceState).toHaveBeenCalledWith(null, '', '#features')
    } finally {
      restore()
      target.remove()
    }
  })

  it('renders drawer groups as accordions whose section children scroll and close the drawer', () => {
    const removeSection = mountSection('pricing')
    render(<Navbar brand="Acme" links={navLinks} sticky />)
    const toggle = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(toggle)
    const drawer = within(document.getElementById(toggle.getAttribute('aria-controls') ?? '')!)
    const groupTrigger = drawer.getByRole('button', { name: /Resources/ })
    expect(groupTrigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(groupTrigger)
    expect(groupTrigger).toHaveAttribute('aria-expanded', 'true')
    const { scrollTo, replaceState, restore } = stubScroll()
    try {
      fireEvent.click(drawer.getByRole('link', { name: 'Pricing' }))
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
      expect(replaceState).toHaveBeenCalledWith(null, '', '#pricing')
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    } finally {
      restore()
      removeSection()
    }
  })

  it('keeps rendering plain page links unchanged', () => {
    render(<Navbar brand="Acme" links={navLinks} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })
})
