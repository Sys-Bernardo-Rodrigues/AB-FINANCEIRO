'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import { CreditCard, Target, Receipt } from 'lucide-react'
import TransactionForm from '@/components/TransactionForm'
import InstallmentForm from '@/components/InstallmentForm'
import PlanForm from '@/components/PlanForm'

type FormType = 'transaction' | 'installment' | 'plan'

export default function AddPage() {
  const searchParams = useSearchParams()
  const [formType, setFormType] = useState<FormType>('transaction')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'installment' || type === 'plan') {
      setFormType(type)
    }
  }, [searchParams])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-secondary-50 pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Adicionar
          </h1>

          {/* Seletor de Tipo de Formulário */}
          <div className="bg-white rounded-xl p-1 mb-6 flex gap-2 border border-secondary-200 shadow-card">
            <button
              type="button"
              onClick={() => setFormType('transaction')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm touch-manipulation ${
                formType === 'transaction'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>Transação</span>
            </button>
            <button
              type="button"
              onClick={() => setFormType('installment')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm touch-manipulation ${
                formType === 'installment'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Parcelamento</span>
            </button>
            <button
              type="button"
              onClick={() => setFormType('plan')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm touch-manipulation ${
                formType === 'plan'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <Target className="w-5 h-5" />
              <span>Planejamento</span>
            </button>
          </div>

          {/* Formulários */}
          {formType === 'transaction' && <TransactionForm />}
          {formType === 'installment' && <InstallmentForm />}
          {formType === 'plan' && <PlanForm />}
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
