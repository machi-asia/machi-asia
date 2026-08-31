"use client";

import { AuthGate } from "@machi-asia/auth";

export interface MediaLibraryProvidersProps {
  /**
   * Base URL of the auth service API. Defaults to same-origin (/api/auth),
   * which works when the host app mounts the auth routes. Set
   * NEXT_PUBLIC_AUTH_API_URL (or this prop) only when auth is served from a
   * different origin / URL.
   */
  authApiUrl?: string;
  children: React.ReactNode;
}

export function Providers({ authApiUrl, children }: MediaLibraryProvidersProps) {
  const url =
    authApiUrl ??
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    "";
  return <AuthGate authApiUrl={url}>{children}</AuthGate>;
}