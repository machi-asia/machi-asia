"use client";

import { AuthGate } from "@machi-asia/auth";

const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthGate authApiUrl={authApiUrl}>{children}</AuthGate>;
}