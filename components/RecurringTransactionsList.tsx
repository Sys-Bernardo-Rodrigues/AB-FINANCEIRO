'use client'

import { useEffect, useState } from 'react'
import { Repeat, Plus } from 'lucide-react'
import RecurringTransactionCard from './RecurringTransactionCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

export default function RecurringTransactionsList() {
  const router = useRouter()
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  useEffect(() => {
    fetchRecurringTransactions()
  }, [filter])

  const fetchRecurringTransactions = async () => {
    try {
      setLoading(true)
      const isActive = filter === 'ALL' ? null : filter === 'ACTIVE'
      const url = isActive !== null 
        ? `/api/recurring-transactions?isActive=${isActive}`
        : '/api/recurring-transactions'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRecurringTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações recorrentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async (id: string) => {
    try {
      const response = await fetch(`/api/recurring-transactions/${id}/execute`, {
        method: 'POST',
      })
      if (response.ok) {
        showToast('Transação recorrente executada com sucesso!', 'success')
        fetchRecurringTransactions()
        router.refresh()
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao executar transação', 'error')
      }
    } catch (error) {
      console.error('Erro ao executar transação recorrente:', error)
      showToast('Erro ao executar transação recorrente', 'error')
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const transaction = recurringTransactions.find(t => t.id === id)
      if (!transaction) return

      const response = await fetch(`/api/recurring-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !transaction.isActive }),
      })
      if (response.ok) {
        showToast(
          transaction.isActive 
            ? 'Transação recorrente pausada' 
            : 'Transação recorrente ativada',
          'success'
        )
        fetchRecurringTransactions()
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao alterar status', 'error')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      showToast('Erro ao alterar status', 'error')
    }
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    const transaction = recurringTransactions.find(t => t.id === id)
    if (transaction) {
      setTransactionToDelete(transaction)
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/recurring-transactions/${transactionToDelete.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        showToast('Transação recorrente deletada com sucesso!', 'success')
        fetchRecurringTransactions()
        setDeleteModalOpen(false)
        setTransactionToDelete(null)
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao deletar transação recorrente', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar transação recorrente:', error)
      showToast('Erro ao deletar transação recorrente', 'error')
    } finally {
      setDeleting(false)
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
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'ALL'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'ACTIVE'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Ativas
        </button>
        <button
          onClick={() => setFilter('INACTIVE')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'INACTIVE'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Inativas
        </button>
      </div>

      {/* Botão Adicionar */}
      <Link
        href="/add?type=recurring"
        className="flex items-center justify-center gap-2 w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Nova Transação Recorrente
      </Link>

      {/* Lista */}
      {recurringTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <Repeat className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhuma transação recorrente encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((transaction) => (
            <RecurringTransactionCard
              key={transaction.id}
              recurringTransaction={transaction}
              onExecute={handleExecute}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false)
            setTransactionToDelete(null)
          }
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        {transactionToDelete && (
          <div className="space-y-4">
            <p className="text-secondary-700">
              Tem certeza que deseja deletar a transação recorrente <strong>"{transactionToDelete.description}"</strong>?
            </p>
            <p className="text-sm text-secondary-500">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={deleting}
                fullWidth
              >
                Deletar
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setTransactionToDelete(null)
                }}
                disabled={deleting}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

