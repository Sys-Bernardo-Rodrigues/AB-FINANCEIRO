'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import InstallmentCard from './InstallmentCard'
import Link from 'next/link'

export default function InstallmentsList() {
  const [installments, setInstallments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')

  useEffect(() => {
    fetchInstallments()
  }, [filter])

  const fetchInstallments = async () => {
    try {
      setLoading(true)
      const status = filter !== 'ALL' ? `?status=${filter}` : ''
      const response = await fetch(`/api/installments${status}`)
      if (response.ok) {
        const data = await response.json()
        setInstallments(data)
      }
    } catch (error) {
      console.error('Erro ao buscar parcelamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextInstallment = async (installmentId: string) => {
    try {
      const response = await fetch(`/api/installments/${installmentId}/next`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchInstallments()
      }
    } catch (error) {
      console.error('Erro ao criar próxima parcela:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'ALL'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'ACTIVE'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'COMPLETED'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Concluídos
        </button>
      </div>

      {/* Botão Adicionar */}
      <Link
        href="/add?type=installment"
        className="flex items-center justify-center gap-2 w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Novo Parcelamento
      </Link>

      {/* Lista */}
      {installments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <CreditCard className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhum parcelamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {installments.map((installment) => (
            <div key={installment.id}>
              <InstallmentCard installment={installment} />
              {installment.status === 'ACTIVE' &&
                installment.currentInstallment < installment.installments && (
                  <button
                    onClick={() => handleNextInstallment(installment.id)}
                    className="mt-2 w-full py-2.5 bg-success-50 text-success-700 rounded-xl text-sm font-semibold hover:bg-success-100 border border-success-200 transition-all"
                  >
                    Pagar Próxima Parcela
                  </button>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
