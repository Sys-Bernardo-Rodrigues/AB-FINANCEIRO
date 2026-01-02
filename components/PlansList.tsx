'use client'

import { useEffect, useState } from 'react'
import { Target, Plus } from 'lucide-react'
import PlanCard from './PlanCard'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

export default function PlansList() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [filter])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const status = filter !== 'ALL' ? `?status=${filter}` : ''
      const response = await fetch(`/api/plans${status}`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Erro ao buscar planejamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (plan: any) => {
    setPlanToDelete(plan)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/plans/${planToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Planejamento deletado com sucesso!', 'success')
        fetchPlans()
        setDeleteModalOpen(false)
        setPlanToDelete(null)
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao deletar planejamento', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar planejamento:', error)
      showToast('Erro ao deletar planejamento', 'error')
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
        href="/add?type=plan"
        className="flex items-center justify-center gap-2 w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Novo Planejamento
      </Link>

      {/* Lista */}
      {plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <Target className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhum planejamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan}
              onDelete={() => handleDeleteClick(plan)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false)
            setPlanToDelete(null)
          }
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        {planToDelete && (
          <div className="space-y-4">
            <p className="text-secondary-700">
              Tem certeza que deseja deletar o planejamento <strong>"{planToDelete.name}"</strong>?
            </p>
            <p className="text-sm text-secondary-500">
              Esta ação não pode ser desfeita. Todas as transações relacionadas serão mantidas.
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
                  setPlanToDelete(null)
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
