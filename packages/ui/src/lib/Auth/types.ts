export type OAuthProvider = 'google' | 'github'

export type AuthMode = 'login' | 'register'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterDetails {
  username: string
  email: string
  password: string
}

export interface AuthUser {
  username: string
  displayName?: string
  avatarUrl?: string
}
