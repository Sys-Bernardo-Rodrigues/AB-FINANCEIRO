'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import { CreditCard, Target, Receipt, Repeat, PiggyBank, Plus } from 'lucide-react'
import TransactionForm from '@/components/TransactionForm'
import InstallmentForm from '@/components/InstallmentForm'
import PlanForm from '@/components/PlanForm'
import RecurringTransactionForm from '@/components/RecurringTransactionForm'
import SavingsGoalForm from '@/components/SavingsGoalForm'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

type FormType = 'transaction' | 'installment' | 'plan' | 'recurring' | 'savings-goal'

function AddPageContent() {
  const searchParams = useSearchParams()
  const [formType, setFormType] = useState<FormType>('transaction')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'installment' || type === 'plan' || type === 'recurring' || type === 'savings-goal') {
      setFormType(type)
    }
  }, [searchParams])

  const formTypes = [
    { 
      id: 'transaction' as FormType, 
      icon: Receipt, 
      label: 'Transação', 
      shortLabel: 'Transação',
      activeClass: 'bg-primary-50 text-primary-700 border-primary-300',
      inactiveClass: 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
    },
    { 
      id: 'recurring' as FormType, 
      icon: Repeat, 
      label: 'Recorrente', 
      shortLabel: 'Recorrente',
      activeClass: 'bg-primary-50 text-primary-700 border-primary-300',
      inactiveClass: 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
    },
    { 
      id: 'installment' as FormType, 
      icon: CreditCard, 
      label: 'Parcelamento', 
      shortLabel: 'Parcelar',
      activeClass: 'bg-warning-50 text-warning-700 border-warning-300',
      inactiveClass: 'text-secondary-600 hover:text-warning-600 hover:bg-warning-50/50'
    },
    { 
      id: 'plan' as FormType, 
      icon: Target, 
      label: 'Planejamento', 
      shortLabel: 'Planejar',
      activeClass: 'bg-success-50 text-success-700 border-success-300',
      inactiveClass: 'text-secondary-600 hover:text-success-600 hover:bg-success-50/50'
    },
    { 
      id: 'savings-goal' as FormType, 
      icon: PiggyBank, 
      label: 'Meta de Economia', 
      shortLabel: 'Meta',
      activeClass: 'bg-success-50 text-success-700 border-success-300',
      inactiveClass: 'text-secondary-600 hover:text-success-600 hover:bg-success-50/50'
    },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 safe-area-bottom">
        <Header />
        <main className="container mx-auto px-4 py-4 max-w-7xl">
          {/* Header da Página */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">
                Adicionar
              </h1>
            </div>
            <p className="text-sm text-secondary-500 ml-13">
              Crie uma nova transação ou registro financeiro
            </p>
          </div>

          {/* Seletor de Tipo de Formulário - Mobile First */}
          <Card variant="default" padding="sm" className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {formTypes.map((form) => {
                const Icon = form.icon
                const isActive = formType === form.id
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setFormType(form.id)}
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 touch-feedback flex-shrink-0 min-w-[100px] border-2 ${
                      isActive
                        ? `${form.activeClass} shadow-sm`
                        : `${form.inactiveClass} border-transparent`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs text-center leading-tight">{form.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Formulários */}
          <div className="animate-fade-in">
            {formType === 'transaction' && <TransactionForm />}
            {formType === 'recurring' && <RecurringTransactionForm />}
            {formType === 'installment' && <InstallmentForm />}
            {formType === 'plan' && <PlanForm />}
            {formType === 'savings-goal' && <SavingsGoalForm />}
          </div>
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

export default function AddPage() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <div className="min-h-screen pb-20 safe-area-bottom">
          <Header />
          <main className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="space-y-4">
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="rectangular" height={400} />
            </div>
          </main>
          <Navigation />
        </div>
      </AuthGuard>
    }>
      <AddPageContent />
    </Suspense>
  )
}
