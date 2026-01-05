'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Garante que os cookies são enviados
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Se retornar 401, limpar o cookie inválido
        if (response.status === 401) {
          // Limpar cookie inválido fazendo logout silencioso
          try {
            await fetch('/api/auth/logout', { 
              method: 'POST',
              credentials: 'include',
            })
          } catch {
            // Ignorar erro ao limpar cookie
          }
        }
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Garante que os cookies são enviados e recebidos
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao fazer login')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/')
    router.refresh()
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include', // Garante que os cookies são enviados e recebidos
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao criar conta')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/')
    router.refresh()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setUser(null)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

