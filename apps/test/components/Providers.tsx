"use client";

import React from "react";
import { AuthProvider } from "@machi-asia/auth";

const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider authApiUrl={authApiUrl}>{children}</AuthProvider>;
}
