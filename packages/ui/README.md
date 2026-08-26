# @machi-asia/ui

Animated, mobile-friendly, reusable React components. Zero runtime dependencies — pure CSS
animations driven by themeable design tokens. Built for Next.js App Router out of the box
(`"use client"` is baked in) and any other React 18/19 stack.

## Install

```bash
npm install @machi-asia/ui
```

Import the stylesheet once (it contains the design tokens every component consumes):

```tsx
import '@machi-asia/ui/styles.css'
```

> Peer dependencies: `react` and `react-dom` (`^18 || ^19`). No other runtime deps.

## Quick start

```tsx
import { Button, Card, CardHeader, CardBody } from '@machi-asia/ui'

export default function Example() {
  return (
    <Card variant="glass" hoverable>
      <CardHeader title="Hello" subtitle="My first Machi UI card" />
      <CardBody>
        <Button variant="primary">Click me</Button>
      </CardBody>
    </Card>
  )
}
```

## Components

| Component | Highlights |
| --- | --- |
| `Button` | Variants `primary / secondary / ghost / danger`, sizes, loading spinner |
| `Card` | Variants `elevated / outline / filled / glass`, hover lift, composable header/body/footer |
| `Calendar` | Direction-aware month slide, min/max dates, controlled + uncontrolled |
| `Dropdown` | Keyboard nav, ARIA combobox/listbox, staggered option entrance, variants `outline / filled / borderless` |
| `Accordion` | Grid-rows height animation, single/multi expand, variants `separated / boxed / flush` |
| `Navbar` | Collapses to hamburger drawer under 768px, variants `solid / glass / transparent / primary`; `primary` adds an avatar/sign-in area with a built-in login/register modal; links support page `href`, `targetId` smooth-scroll section references, and `children` dropdown menus; `linkAlign` centers/right-aligns just the link group; `brand` accepts text or an image/logo (auto-capped to bar height) |
| `Footer` | Wide footer band — optional brand/logo slot, link row, free-form children, separated bottom note bar (copyright), variants `solid / transparent` |
| `AuthModal` | Login & register forms (username/password/email) plus Google & GitHub buttons — logic-free hooks (`onLogin` / `onRegister` / `onOAuthLogin`) for your auth backend |
| `Modal` | Scale-in on desktop, bottom sheet under 640px, focus trap + restore, animated open/close |
| `Tabs` | Spring sliding indicator, direction-aware panel slides, variants `underline / pills / enclosed` |
| `Switch` | Spring thumb, color variants `primary / success / danger` |
| `Toast` | `ToastProvider` + `useToast()`, four variants, auto-dismiss, spring entrance/exit |
| `Table` | Generic `<Table<Row>>`, sortable columns, sticky header, footer row, loading/empty states, `hideBelow` responsive columns |
| `TextEditor` | Dependency-free rich text via contentEditable, active-state toolbar, HTML value |
| `Gallery` | `grid / list` layouts, variants `card / overlay / plain`, built-in lightbox with keyboard nav |
| `ScrollReveal` | Scroll-scrubbed entrances — 10 variants `fade-up / fade-down / fade-left / fade-right / zoom-in / zoom-out / blur / wipe / rotate / flip` that interpolate directly with scroll position (and reverse on scroll-back) |
| `ScrollStack` | Sticky pull-back deck — cards pin to the top while later sections slide over them, receding further (scale + lift + dim) with each card that stacks on top; tune via `scaleAmount` / `dimAmount` |
| `ScrollHorizontal` | Pinned section where vertical scroll scrubs the content track sideways, one viewport per slide |
| `ScrollZoom` | Pinned section whose content recedes into the distance (`zoom-out`) or rushes forward into place (`zoom-in`), tuned via `length` |
| `ScrollCurtain` | Pinned reveal — an opaque curtain slides off the section along `up / down / left / right`; render your own elements on the cover via `curtain` |
| `ScrollRotate` | Pinned section whose content spins through a configurable `angle` (negative reverses) across the pin |
| `ScrollSplit` | Pinned reveal — two opaque panels part like elevator doors along `horizontal / vertical` axes; render your own elements on the doors via `panelA` / `panelB` |
| `ScrollDepth` | Pinned 3D tunnel — stacked layers fly from deep background towards the viewer one after another (`length`, auto-derived per layer count) |
| `Parallax` | Depth wrapper — content drifts against (or with) scroll at a configurable `speed`, expressed as a fraction of the viewport height |

Every interactive element respects touch: ≥44px hit targets, no hover-only affordances on touch
devices, safe-area insets for drawers/toasts/modals.

### Primary navbar & auth modal

The `primary` variant turns the Navbar into a ready-made app shell header: signed-out visitors get
a **Sign in** button, signed-in users get an avatar + username with a sign-out menu. Clicking
sign-in opens the built-in `AuthModal` (username + password login, username/email/password
registration, Google/GitHub buttons). All handlers are blank by design — wire them to your own
auth backend; the components only manage UI state:

```tsx
import { Navbar } from '@machi-asia/ui'
import type { AuthUser } from '@machi-asia/ui'

<Navbar
  variant="primary"
  brand="Machi"
  links={[
    { label: 'Docs', href: '/docs' },                        // page link
    {                                                        // dropdown menu
      label: 'Resources',
      children: [{ label: 'Blog', href: '/blog' }],
    },
    { label: 'Pricing', targetId: 'pricing' },               // smooth-scrolls to #pricing
  ]}
  user={user satisfies AuthUser | null}          // null => sign-in button
  authError={error}                              // shown inside the modal
  onLogin={({ username, password }) => api.login(username, password)}
  onRegister={({ username, email, password }) => api.register({ username, email, password })}
  onOAuthLogin={(provider) => api.oauth(provider)} // 'google' | 'github'
  onSignOut={() => api.signOut()}
/>
```

Every link kind works in both the desktop bar and the mobile drawer (dropdown groups become
inline accordions). Section references scroll smoothly and land below the sticky header —
all handled internally by the component.

Handlers may return promises: while pending, the form shows spinners and disables inputs; on
rejection the modal stays open (thrown `Error.message` is displayed unless you pass `authError`);
on success it closes. The `AuthModal` is also exported standalone for custom placements:

```tsx
import { AuthModal } from '@machi-asia/ui'

<AuthModal open={open} onClose={close} onLogin={...} onOAuthLogin={...} />
```

### Scroll effects notes

- The reveal components are triggered by `IntersectionObserver`; the structural ones
  (`ScrollStack`, `ScrollHorizontal`, `Parallax`) follow scroll position through a
  rAF loop that writes a single CSS custom property (`--mui-progress`) — all motion is
  pure transform/opacity work on the compositor, with no React re-renders while scrolling.
- Under `prefers-reduced-motion: reduce`, reveals still appear (instantly) and decorative
  drift/pull-back transforms are neutralized; the MotionToggle in the playground overrides this.

## Dark mode

Dark tokens ship automatically:

- Follows the OS by default (`prefers-color-scheme: dark`).
- Force a mode: set `data-mui-theme="dark"` or `"light"` on `<html>`.

```html
<script>
  // before hydration, e.g. read localStorage
  document.documentElement.dataset.muiTheme = 'dark'
</script>
```

Add `suppressHydrationWarning` to your `<html>` when mutating it pre-hydration.

### Theming

Override any token on `:root` to restyle everything:

```css
:root {
  --mui-primary: #0ea5e9;
  --mui-radius-lg: 24px;
  --mui-duration-normal: 300ms;
}
```

Animations honor `prefers-reduced-motion: reduce` (all durations collapse to ~1ms).

## Dev playground

```bash
npm run dev          # Next.js test app on http://localhost:3000
npm run build        # build the library -> dist/
npm run typecheck    # strict TS over src/lib
npm run preview:pack # build + npm pack --dry-run (verify package contents)
```

The playground (`playground/`) imports components straight from `src/lib` source via path
aliases, so edits hot-reload instantly without rebuilding the library. It also ships a dark-mode
toggle and a "force animations" toggle (useful for testing with OS reduced-motion enabled).

Only `dist/` is published (`"files": ["dist"]`) — the playground never reaches npm.

## Publishing

1. Bump `version` in `package.json`.
2. `npm run preview:pack` and sanity-check the tarball.
3. `npm publish` (scoped public access is preconfigured).

## License

MIT © Machi
