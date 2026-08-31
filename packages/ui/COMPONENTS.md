# `@machi-asia/ui` — Component Documentation

Core design system. Every component below is **presentational**: no auth, no providers, no env vars, and no API endpoints are required. Import the package stylesheet once in the host app before rendering.

| Component | Requires Auth | Requires Provider | Requires Env | API calls |
|---|---|---|---|---|
| `Button` | No | – | – | – |
| `Card` (+`CardHeader`/`CardBody`/`CardFooter`) | No | – | – | – |
| `Accordion` (+`AccordionItem`) | No | – | – | – |
| `Switch` | No | – | – | – |
| `Tabs` | No | – | – | – |
| `Table` | No | – | – | – |
| `Dropdown` | No | – | – | – |
| `Calendar` | No | – | – | – |
| `AuthModal` | No | – | – | – |
| `Modal` | No | – | – | – |
| `Navbar` | No | – | – | – |
| `Footer` | No | – | – | – |
| `Gallery` | No | – | – | – |
| `TextEditor` | No | – | – | – |
| `ToastProvider` / `useToast()` | No | `ToastProvider` (for `useToast`) | – | – |
| `ScrollReveal` | No | – | – | – |
| `ScrollStack` | No | – | – | – |
| `ScrollHorizontal` | No | – | – | – |
| `Parallax` | No | – | – | – |
| `ScrollZoom` | No | – | – | – |
| `ScrollCurtain` | No | – | – | – |
| `ScrollRotate` | No | – | – | – |
| `ScrollSplit` | No | – | – | – |
| `ScrollDepth` | No | – | – | – |

## Notes

- `AuthModal` is **pure UI** — it invokes `onLogin`/`onRegister`/`onOAuthLogin`/`onGuest` props. Wire those callbacks to `@machi-asia/auth`'s `login()`/`register()`/`guestLogin()` (or any backend) in the host app.
- `useToast()` throws if called outside `ToastProvider`. Mount `<ToastProvider>` at the app root if you use toasts.

Machine-readable manifest: `component-docs.json`.