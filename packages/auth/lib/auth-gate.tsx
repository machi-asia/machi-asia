"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthModal, type LoginCredentials, type RegisterDetails } from "@machi-asia/ui";
import { AuthProvider, useAuth } from "./auth-provider";

export interface AuthGateProps {
  authApiUrl: string;
  children: ReactNode;
}

export function AuthGate({ authApiUrl, children }: AuthGateProps) {
  return (
    <AuthProvider authApiUrl={authApiUrl}>
      <AuthGateInner>{children}</AuthGateInner>
    </AuthProvider>
  );
}

function AuthGateInner({ children }: { children: ReactNode }) {
  const { session, loading, login, register, guestLogin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      setModalOpen(true);
    }
  }, [loading, session]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#888",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <AuthModal
        open={modalOpen}
        onClose={() => {
          if (!session) return;
          setModalOpen(false);
        }}
        authError={authError}
        onLogin={async (creds: LoginCredentials) => {
          setAuthError(null);
          try {
            await login(creds.email, creds.password);
            setModalOpen(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Login failed");
            throw err;
          }
        }}
        onRegister={async (details: RegisterDetails) => {
          setAuthError(null);
          try {
            await register(details.email, details.password);
            setModalOpen(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Registration failed");
            throw err;
          }
        }}
        onGuest={async () => {
          setAuthError(null);
          try {
            await guestLogin();
            setModalOpen(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Guest login failed");
            throw err;
          }
        }}
      />
    );
  }

  return <>{children}</>;
}
