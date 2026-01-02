'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar após 3 segundos
    const timer = setTimeout(() => {
      router.push('/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-secondary-100 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Registro Desabilitado</h1>
          <p className="text-secondary-600">O registro público não está disponível</p>
        </div>

        <div className="glass rounded-3xl shadow-elevated p-8 border border-secondary-200/50 backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8 text-warning-600" />
            </div>
            <p className="text-secondary-700 mb-4">
              O registro de novos usuários está desabilitado. Usuários só podem ser criados dentro do sistema por administradores.
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="primary"
              fullWidth
              size="lg"
            >
              Ir para Login
            </Button>
            <p className="text-sm text-secondary-500 mt-4">
              Você será redirecionado automaticamente em alguns segundos...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
