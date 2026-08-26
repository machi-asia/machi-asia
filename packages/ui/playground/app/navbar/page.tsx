'use client'

import { useState } from 'react'
import { Button, Navbar, ToastProvider, useToast } from '@machi-asia/ui'
import type { AuthUser, LoginCredentials, OAuthProvider, RegisterDetails } from '@machi-asia/ui'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function PrimaryNavDemo() {
  const toast = useToast()
  const [user, setUser] = useState<AuthUser | null>(null)

  const handleLogin = async ({ username }: LoginCredentials) => {
    await wait(900)
    if (username === 'fail') throw new Error('Invalid username or password')
    setUser({ username, displayName: username })
    toast.show({ title: `Welcome back, ${username}!`, variant: 'success' })
  }

  const handleRegister = async ({ username }: RegisterDetails) => {
    await wait(900)
    setUser({ username, displayName: username })
    toast.show({ title: `Account created for ${username}`, variant: 'success' })
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    await wait(700)
    setUser({
      username: `${provider}-demo`,
      displayName: provider === 'google' ? 'Google Demo' : 'GitHub Demo',
    })
    toast.show({ title: `Signed in with ${provider}`, variant: 'success' })
  }

  const handleSignOut = () => {
    setUser(null)
    toast.show({ title: 'Signed out', variant: 'info' })
  }

  return (
    <Navbar
      variant="primary"
      brand="Machi"
      links={[
        { label: 'Products', href: '#' },
        {
          label: 'Resources',
          children: [
            { label: 'Documentation', href: '#' },
            { label: 'Changelog', href: '#' },
          ],
        },
        { label: 'Try it', targetId: 'primary-demo' },
        { label: 'Notes', targetId: 'navbar-notes' },
      ]}
      user={user}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onOAuthLogin={handleOAuth}
      onSignOut={handleSignOut}
    />
  )
}

function DrawerHint() {
  const toast = useToast()
  return (
    <>
      <div style={{ height: 14 }} />
      <Navbar
        brand="Machi"
        links={[
          { label: 'Products', href: '#' },
          { label: 'Solutions', href: '#' },
          { label: 'Pricing', href: '#' },
          { label: 'About', href: '#' },
        ]}
        actions={
          <Button size="sm" onClick={() => toast.show({ title: 'CTA clicked', variant: 'info' })}>
            Get started
          </Button>
        }
      />
      <div style={{ height: 14 }} />
      <Navbar
        variant="glass"
        brand="Glass"
        links={[
          { label: 'Docs', href: '#' },
          { label: 'Blog', href: '#' },
        ]}
      />
    </>
  )
}

export default function NavbarPage() {
  return (
    <ToastProvider>
      <div className="pg-hero">
        <h1>Navbar</h1>
        <p>
          The <strong>primary</strong> variant ships an avatar/sign-in area wired to a login/register modal with Google
          &amp; GitHub buttons — auth logic is yours to provide. Shrink the viewport under 768px (or use device mode):
          links collapse into a hamburger drawer.
        </p>
      </div>
      <PrimaryNavDemo />
      <section id="primary-demo" className="pg-section" style={{ marginTop: 20 }}>
        <h2>Try it</h2>
        <ul style={{ color: 'var(--mui-text-muted)', lineHeight: 1.7 }}>
          <li>“Products” is a plain page link, “Resources” opens a dropdown menu.</li>
          <li>“Try it” and “Notes” are section references — they smooth-scroll to the matching sections below (offset by the sticky header).</li>
          <li>Click “Sign in” to open the modal — any username works; use “fail” as the username to see the error path.</li>
          <li>Google/GitHub buttons and register tab are fully mocked with delays.</li>
          <li>Once “signed in”, click the avatar for the sign-out menu (or use the drawer on mobile).</li>
        </ul>
      </section>
      <DrawerHint />
      <section className="pg-section" style={{ marginTop: 20 }}>
        <h2>Link alignment</h2>
        <p style={{ color: 'var(--mui-text-muted)' }}>
          <code>linkAlign</code> positions only the link group — brand and sign-in/actions stay pinned to their edges.
        </p>
      </section>
      <Navbar
        brand={
          <>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                stroke="var(--mui-primary)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M12 22V12m0 0L3 7m9 5 9-5" stroke="var(--mui-primary)" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Center
          </>
        }
        linkAlign="center"
        links={[
          { label: 'Features', href: '#' },
          { label: 'Pricing', href: '#' },
          { label: 'Blog', href: '#' },
        ]}
      />
      <div style={{ height: 14 }} />
      <Navbar
        brand="Right"
        linkAlign="right"
        links={[
          { label: 'Features', href: '#' },
          { label: 'Pricing', href: '#' },
          { label: 'Blog', href: '#' },
        ]}
      />
      <section id="navbar-notes" className="pg-section" style={{ marginTop: 20 }}>
        <h2>Notes</h2>
        <ul style={{ color: 'var(--mui-text-muted)', lineHeight: 1.7 }}>
          <li>Sticky by default; pass sticky=&#123;false&#125; to scroll away.</li>
          <li>The drawer locks body scroll and closes on Escape, overlay tap or link tap.</li>
          <li>Hamburger bars animate into an X when open.</li>
        </ul>
      </section>
    </ToastProvider>
  )
}
