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

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
