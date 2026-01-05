'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/utils/api'

export interface User {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  user: User
  token?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const hasCheckedRef = useRef(false)

  const checkAuth = useCallback(async () => {
    if (hasCheckedRef.current) return
    
    hasCheckedRef.current = true
    try {
      // skipAuthRedirect = true para evitar loop de redirecionamento
      const response = await apiRequest<{ user: User }>('/auth/me', {}, true)
      setUser(response.user)
      setLoading(false)
      return response.user
    } catch (error) {
      setUser(null)
      setLoading(false)
      return null
    }
  }, [])

  useEffect(() => {
    // Só verificar uma vez na montagem
    if (!hasCheckedRef.current) {
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(response.user)
      hasCheckedRef.current = false // Permitir nova verificação após login
      router.replace('/')
      return response.user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Ignorar erros no logout
    } finally {
      setUser(null)
      hasCheckedRef.current = false
      router.replace('/login')
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  }
}

