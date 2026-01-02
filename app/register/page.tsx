'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Wallet, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      const errorMessage = 'As senhas não coincidem'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return
    }

    if (password.length < 6) {
      const errorMessage = 'A senha deve ter pelo menos 6 caracteres'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      showToast('Conta criada com sucesso!', 'success')
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar conta'
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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Criar Conta</h1>
          <p className="text-secondary-600">Comece a controlar suas finanças hoje</p>
        </div>

        <div className="glass rounded-3xl shadow-elevated p-8 border border-secondary-200/50 backdrop-blur-xl animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              required
              helperText="Mínimo de 6 caracteres"
            />

            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              required
              error={
                confirmPassword && password !== confirmPassword
                  ? 'As senhas não coincidem'
                  : undefined
              }
            />

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={loading}
              variant="primary"
              fullWidth
              size="lg"
            >
              Criar Conta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
