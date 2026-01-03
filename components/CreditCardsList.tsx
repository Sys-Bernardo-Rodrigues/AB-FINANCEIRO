'use client'

import { useEffect, useState } from 'react'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import CreditCardCard from './CreditCardCard'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import CreditCardForm from './CreditCardForm'

export default function CreditCardsList() {
  const [creditCards, setCreditCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [creditCardToDelete, setCreditCardToDelete] = useState<any | null>(null)
  const [creditCardToEdit, setCreditCardToEdit] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCreditCards()
  }, [])

  const fetchCreditCards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/credit-cards')
      if (response.ok) {
        const data = await response.json()
        setCreditCards(data)
      }
    } catch (error) {
      console.error('Erro ao buscar cartões de crédito:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (creditCard: any) => {
    setCreditCardToDelete(creditCard)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!creditCardToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/credit-cards/${creditCardToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Cartão de crédito deletado com sucesso!', 'success')
        fetchCreditCards()
        setDeleteModalOpen(false)
        setCreditCardToDelete(null)
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao deletar cartão de crédito', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar cartão de crédito:', error)
      showToast('Erro ao deletar cartão de crédito', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleEditClick = (creditCard: any) => {
    setCreditCardToEdit(creditCard)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setCreditCardToEdit(null)
    fetchCreditCards()
    showToast('Cartão de crédito atualizado com sucesso!', 'success')
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
      {creditCards.length === 0 ? (
        <div className="text-center py-12">
          <CreditCardIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-700 mb-2">
            Nenhum cartão cadastrado
          </h3>
          <p className="text-secondary-500 mb-6">
            Comece adicionando seu primeiro cartão de crédito
          </p>
          <Link
            href="/credit-cards/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Adicionar Cartão
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <CreditCardCard
                key={card.id}
                creditCard={card}
                onDelete={() => handleDeleteClick(card)}
                onEdit={() => handleEditClick(card)}
              />
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Link
              href="/credit-cards/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Adicionar Novo Cartão
            </Link>
          </div>
        </>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setCreditCardToDelete(null)
        }}
        title="Deletar Cartão de Crédito"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-700">
            Tem certeza que deseja deletar o cartão <strong>{creditCardToDelete?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setCreditCardToDelete(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de edição */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setCreditCardToEdit(null)
        }}
        title="Editar Cartão de Crédito"
        size="md"
      >
        {creditCardToEdit && (
          <CreditCardForm
            creditCard={creditCardToEdit}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </div>
  )
}

