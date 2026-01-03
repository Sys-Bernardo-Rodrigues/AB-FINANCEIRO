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
      color: 'primary'
    },
    { 
      id: 'recurring' as FormType, 
      icon: Repeat, 
      label: 'Recorrente', 
      shortLabel: 'Recorrente',
      color: 'primary'
    },
    { 
      id: 'installment' as FormType, 
      icon: CreditCard, 
      label: 'Parcelamento', 
      shortLabel: 'Parcelar',
      color: 'warning'
    },
    { 
      id: 'plan' as FormType, 
      icon: Target, 
      label: 'Planejamento', 
      shortLabel: 'Planejar',
      color: 'success'
    },
    { 
      id: 'savings-goal' as FormType, 
      icon: PiggyBank, 
      label: 'Meta de Economia', 
      shortLabel: 'Meta',
      color: 'success'
    },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white pb-32 safe-area-bottom">
        <Header />
        <main className="w-full max-w-md mx-auto px-4 py-3 pb-8 safe-area-top">
          {/* Header da Página - Otimizado para iPhone 14 */}
          <div className="mb-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-secondary-900">
                Adicionar
              </h1>
            </div>
            <p className="text-xs text-secondary-500 ml-12">
              Crie uma nova transação ou registro financeiro
            </p>
          </div>

          {/* Seletor de Tipo de Formulário - Otimizado para iPhone 14 */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {formTypes.map((form) => {
                const Icon = form.icon
                const isActive = formType === form.id
                const colorClasses = {
                  primary: isActive 
                    ? 'bg-primary-50 text-primary-700 border-primary-300 shadow-sm' 
                    : 'text-secondary-600 border-transparent bg-white hover:bg-primary-50/30',
                  warning: isActive 
                    ? 'bg-warning-50 text-warning-700 border-warning-300 shadow-sm' 
                    : 'text-secondary-600 border-transparent bg-white hover:bg-warning-50/30',
                  success: isActive 
                    ? 'bg-success-50 text-success-700 border-success-300 shadow-sm' 
                    : 'text-secondary-600 border-transparent bg-white hover:bg-success-50/30',
                }
                
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setFormType(form.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-200 touch-feedback flex-shrink-0 min-w-[85px] border-2 ${colorClasses[form.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] text-center leading-tight font-medium">{form.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Formulários */}
          <div className="animate-fade-in mb-6">
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
        <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white pb-32 safe-area-bottom">
          <Header />
          <main className="w-full max-w-md mx-auto px-4 py-3 pb-8 safe-area-top">
            <div className="space-y-3">
              <Skeleton variant="rectangular" height={50} />
              <Skeleton variant="rectangular" height={80} />
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
