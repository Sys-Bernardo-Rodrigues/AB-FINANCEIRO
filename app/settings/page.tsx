'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import { CreditCard, Target, Receipt, Repeat, PiggyBank } from 'lucide-react'
import TransactionForm from '@/components/TransactionForm'
import InstallmentForm from '@/components/InstallmentForm'
import PlanForm from '@/components/PlanForm'
import RecurringTransactionForm from '@/components/RecurringTransactionForm'
import SavingsGoalForm from '@/components/SavingsGoalForm'

type FormType = 'transaction' | 'installment' | 'plan' | 'recurring' | 'savings-goal'

export default function AddPage() {
  const searchParams = useSearchParams()
  const [formType, setFormType] = useState<FormType>('transaction')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'installment' || type === 'plan' || type === 'recurring' || type === 'savings-goal') {
      setFormType(type)
    }
  }, [searchParams])

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Adicionar
          </h1>

          {/* Seletor de Tipo de Formulário */}
          <div className="glass rounded-3xl p-2 mb-6 sm:mb-8 flex flex-wrap gap-2 border border-secondary-200/50 shadow-card backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setFormType('transaction')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation hover-lift ${
                formType === 'transaction'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-md'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span className="hidden sm:inline">Transação</span>
            </button>
            <button
              type="button"
              onClick={() => setFormType('recurring')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation hover-lift ${
                formType === 'recurring'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-md'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Repeat className="w-5 h-5" />
              <span className="hidden sm:inline">Recorrente</span>
            </button>
            <button
              type="button"
              onClick={() => setFormType('installment')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation hover-lift ${
                formType === 'installment'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-md'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">Parcelamento</span>
            </button>
            <button
              type="button"
              onClick={() => setFormType('plan')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation hover-lift ${
                formType === 'plan'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-md'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="hidden sm:inline">Planejamento</span>
            </button>
          </div>

          {/* Formulários */}
          {formType === 'transaction' && <TransactionForm />}
          {formType === 'recurring' && <RecurringTransactionForm />}
          {formType === 'installment' && <InstallmentForm />}
          {formType === 'plan' && <PlanForm />}
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import FinancialCalendar from '@/components/FinancialCalendar'
import AuthGuard from '@/components/AuthGuard'

export default function CalendarPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Calendário Financeiro
          </h1>
          <FinancialCalendar />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import InstallmentsList from '@/components/InstallmentsList'
import AuthGuard from '@/components/AuthGuard'

export default function InstallmentsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Parcelamentos
          </h1>
          <InstallmentsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Wallet, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

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
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen  flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Bem-vindo</h1>
          <p className="text-secondary-600">Entre na sua conta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600 text-sm">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import NotificationsList from '@/components/NotificationsList'
import AuthGuard from '@/components/AuthGuard'

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Notificações
          </h1>
          <NotificationsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import PlansList from '@/components/PlansList'
import AuthGuard from '@/components/AuthGuard'

export default function PlansPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Planejamentos
          </h1>
          <PlansList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
'use client'

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import ReceiptList from '@/components/ReceiptList'
import ReceiptUpload from '@/components/ReceiptUpload'
import { useState } from 'react'

export default function ReceiptsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Forçar atualização da lista
    setRefreshKey((prev) => prev + 1)
  }

  const handleError = (error: string) => {
    alert(error)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Comprovantes
            </h1>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-secondary-200 shadow-card mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Enviar Novo Comprovante
            </h2>
            <ReceiptUpload
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
          </div>

          <ReceiptList key={refreshKey} />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import RecurringTransactionsList from '@/components/RecurringTransactionsList'
import AuthGuard from '@/components/AuthGuard'

export default function RecurringPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Transações Recorrentes
          </h1>
          <RecurringTransactionsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Wallet, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'

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
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen  flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Criar Conta</h1>
          <p className="text-secondary-600">Comece a controlar suas finanças hoje</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
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
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import ReportsDashboard from '@/components/ReportsDashboard'
import AuthGuard from '@/components/AuthGuard'

export default function ReportsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Relatórios e Análises
          </h1>
          <ReportsDashboard />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import SavingsGoalsList from '@/components/SavingsGoalsList'
import AuthGuard from '@/components/AuthGuard'

export default function SavingsGoalsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Metas de Economia
          </h1>
          <SavingsGoalsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

'use client'

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import ScheduledTransactionsList from '@/components/ScheduledTransactionsList'
import AuthGuard from '@/components/AuthGuard'

export default function ScheduledPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Transações Agendadas
          </h1>
          <ScheduledTransactionsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { ArrowRight, Receipt, Tag, Users } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Configurações
          </h1>
          
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-secondary-900">Geral</h2>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-secondary-200">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Moeda</span>
                <span className="text-primary-600 font-semibold">BRL (R$)</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-secondary-200">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Notificações</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Versão</span>
                <span className="text-secondary-500">1.0.0</span>
              </div>
            </div>

            {/* Gerenciamento de Transações */}
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Transações</h2>
                    <p className="text-sm text-secondary-500">Visualize e delete transações</p>
                  </div>
                </div>
              </div>
              <Link
                href="/transactions/manage"
                className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group"
              >
                <span className="font-medium text-primary-700">Abrir Gerenciador de Transações</span>
                <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Gerenciamento de Categorias */}
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Categorias</h2>
                    <p className="text-sm text-secondary-500">Crie, edite e delete categorias</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/categories/manage"
                  className="flex items-center justify-between w-full px-4 py-3 bg-success-50 hover:bg-success-100 border border-success-200 rounded-xl transition-colors group"
                >
                  <span className="font-medium text-success-700">Abrir Gerenciador de Categorias</span>
                  <ArrowRight className="w-5 h-5 text-success-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/categories/insights"
                  className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group"
                >
                  <span className="font-medium text-primary-700">Ver Análise de Categorias</span>
                  <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Gerenciamento de Usuários */}
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Usuários</h2>
                    <p className="text-sm text-secondary-500">Crie, edite e delete usuários</p>
                  </div>
                </div>
              </div>
              <Link
                href="/users/manage"
                className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group"
              >
                <span className="font-medium text-primary-700">Abrir Gerenciador de Usuários</span>
                <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import TransactionList from '@/components/TransactionList'
import TransactionFilters, { FilterState } from '@/components/TransactionFilters'
import AuthGuard from '@/components/AuthGuard'
import ExportButton from '@/components/ExportButton'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'ALL',
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  })

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.type !== 'ALL') {
        params.append('type', filters.type)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }
      if (filters.minAmount) {
        params.append('minAmount', filters.minAmount)
      }
      if (filters.maxAmount) {
        params.append('maxAmount', filters.maxAmount)
      }

      const response = await fetch(`/api/transactions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Todas as Transações
            </h1>
            <div className="flex gap-2">
              <ExportButton
                type="transactions"
                format="csv"
                startDate={filters.startDate}
                endDate={filters.endDate}
                transactionType={filters.type}
                className="hidden sm:flex"
              />
              <ExportButton
                type="transactions"
                format="xlsx"
                startDate={filters.startDate}
                endDate={filters.endDate}
                transactionType={filters.type}
              />
            </div>
          </div>
          
          <TransactionFilters onFilterChange={handleFilterChange} />
          
          {loading ? (
            <div className="flex items-center justify-center py-12 mt-6">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <TransactionList transactions={transactions} />
            </div>
          )}
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
'use client'

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import TrendsAnalysis from '@/components/TrendsAnalysis'
import AuthGuard from '@/components/AuthGuard'

export default function TrendsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen  pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Análise de Tendências
          </h1>
          <TrendsAnalysis />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

