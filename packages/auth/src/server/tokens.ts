import type { User } from "@supabase/supabase-js";

export interface PublicUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  created_at: string | null;
  last_sign_in_at: string | null;
}

export interface TokenEnvelope {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  user: PublicUser;
}

export function toPublicUser(user: User): PublicUser {
  const roles = user.app_metadata?.roles;
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    roles: Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [],
    created_at: user.created_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

export interface TokenEnvelopeInput {
  access_token: string;
  refresh_token: string;
  expires_in?: number | null;
  expires_at?: number | null;
  user?: User | null;
}

export function toTokenEnvelope(session: TokenEnvelopeInput): TokenEnvelope {
  const expiresIn = session.expires_in ?? 3600;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + expiresIn,
    user: session.user ? toPublicUser(session.user) : FALLBACK_USER,
  };
}

const FALLBACK_USER: PublicUser = {
  id: "",
  email: null,
  phone: null,
  roles: [],
  created_at: null,
  last_sign_in_at: null,
};
