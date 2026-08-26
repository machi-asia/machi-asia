export type OAuthProvider = 'google' | 'github'

export type AuthMode = 'login' | 'register'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterDetails {
  email: string
  password: string
}

export interface AuthUser {
  email: string
  username?: string
  displayName?: string
  avatarUrl?: string
}
