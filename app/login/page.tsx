'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Wallet, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      showToast('Login realizado com sucesso!', 'success')
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-secondary-100 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Bem-vindo</h1>
          <p className="text-secondary-600">Entre na sua conta para continuar</p>
        </div>

        <div className="glass rounded-3xl shadow-elevated p-8 border border-secondary-200/50 backdrop-blur-xl animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
              error={error && !password ? error : undefined}
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              required
              error={error && password ? error : undefined}
            />

            <Button
              type="submit"
              isLoading={loading}
              variant="primary"
              fullWidth
              size="lg"
            >
              Entrar
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
