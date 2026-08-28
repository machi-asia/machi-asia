# media-library (`@machi-asia/media-library`)

Media asset library (images) exposed as a package of React components and Next.js route handlers.
Uses `@machi-asia/ui` for components and Supabase for storage + metadata.

## Components

- `Providers` — Supabase clients + auth context provider for the media UI.
- `MediaPage` — full gallery/table media page (upload, search, list toggle, delete).
- `MediaLibraryModal` — `@machi-asia/ui` Modal wrapping the upload/gallery experience.

## Routes

- `POST/GET /routes/media` (`@machi-asia/media-library/routes/media`) — list media, upload file.
- `DELETE /routes/media-by-id` (`@machi-asia/media-library/routes/media-by-id`) — soft-delete.

Routes trust `x-gateway-sub` for user identity (requests are routed through the api-gateway, which
verifies tokens). Files are uploaded to the Supabase Storage `media` bucket; metadata lives in the
`media` table. See `.env.example` for required env vars.

## Build & test

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Related

- Gateway: `@machi-asia/api-gateway` authenticates requests ahead of these routes.