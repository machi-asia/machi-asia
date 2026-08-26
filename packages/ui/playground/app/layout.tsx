import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { MotionToggle } from './motion-toggle'
import { MotionNotice } from './motion-notice'
import '../../src/lib/styles/global.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Machi UI Playground',
  description: 'Test page for all @machi-asia/ui components',
}

const THEME_INIT =
  "try{var t=localStorage.getItem('mui-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.muiTheme=t}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.muiTheme='dark'}}catch(e){}"

const MOTION_INIT =
  "try{if(localStorage.getItem('mui-force-motion')==='1'){document.documentElement.setAttribute('data-force-motion','')}}catch(e){}"

const NAV = [
  ['Button', '/button'],
  ['Card', '/card'],
  ['Calendar', '/calendar'],
  ['Dropdown', '/dropdown'],
  ['Accordion', '/accordion'],
  ['Navbar', '/navbar'],
  ['Footer', '/footer'],
  ['Modal', '/modal'],
  ['Tabs', '/tabs'],
  ['Switch', '/switch'],
  ['Toast', '/toast'],
  ['Table', '/table'],
  ['Editor', '/text-editor'],
  ['Gallery', '/gallery'],
  ['Scroll FX', '/scroll-effects'],
] as const

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT }} />
        <MotionNotice />
        <header className="pg-topbar">
          <Link href="/" className="pg-brand">
            Machi UI <span>Playground</span>
          </Link>
          <nav className="pg-nav">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} className="pg-navlink">
                {label}
              </Link>
            ))}
          </nav>
          <div className="pg-topbar-end">
            <MotionToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="pg-main">{children}</main>
      </body>
    </html>
  )
}
