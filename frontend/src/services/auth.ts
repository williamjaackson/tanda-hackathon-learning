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
  private static USER_KEY = 'auth_user'

  static async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Sign up failed')
    }

    const authData: AuthResponse = await response.json()
    // Token is now in HTTP-only cookie, only save user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user))
    return authData
  }

  static async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Sign in failed')
    }

    const authData: AuthResponse = await response.json()
    // Token is now in HTTP-only cookie, only save user data
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user))
    return authData
  }

  static signOut(): void {
    // Clear user data from localStorage
    localStorage.removeItem(this.USER_KEY)
    // Cookie will be cleared by the browser when it expires
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
    return this.getUser() !== null
  }
}
