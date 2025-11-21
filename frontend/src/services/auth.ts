const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token'
  private static USER_KEY = 'auth_user'

  static async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Sign up failed')
    }

    const authData: AuthResponse = await response.json()
    this.saveAuth(authData)
    return authData
  }

  static async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Sign in failed')
    }

    const authData: AuthResponse = await response.json()
    this.saveAuth(authData)
    return authData
  }

  static signOut(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static getUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY)
    if (!userJson) return null
    try {
      return JSON.parse(userJson)
    } catch {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  private static saveAuth(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.access_token)
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user))
  }
}
