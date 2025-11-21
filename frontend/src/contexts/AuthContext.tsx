import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthService } from '@/services/auth'
import type { User, SignUpData, SignInData } from '@/services/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signUp: (data: SignUpData) => Promise<void>
  signIn: (data: SignInData) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on mount
    const storedUser = AuthService.getUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  const signUp = async (data: SignUpData) => {
    const response = await AuthService.signUp(data)
    setUser(response.user)
  }

  const signIn = async (data: SignInData) => {
    const response = await AuthService.signIn(data)
    setUser(response.user)
  }

  const signOut = () => {
    AuthService.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
