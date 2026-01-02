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
            <button
              type="button"
              onClick={() => setFormType('savings-goal')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation hover-lift ${
                formType === 'savings-goal'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-md'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50/50'
              }`}
            >
              <PiggyBank className="w-5 h-5" />
              <span className="hidden sm:inline">Meta</span>
            </button>
          </div>

          {/* Formulários */}
          {formType === 'transaction' && <TransactionForm />}
          {formType === 'recurring' && <RecurringTransactionForm />}
          {formType === 'installment' && <InstallmentForm />}
          {formType === 'plan' && <PlanForm />}
          {formType === 'savings-goal' && <SavingsGoalForm />}
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
