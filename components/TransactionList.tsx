'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Receipt, Trash2, MoreVertical, FileImage, Eye, Download } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { SkeletonTransaction } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Card from '@/components/ui/Card'
import { showToast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface Receipt {
  id: string
  filename: string
  originalFilename: string
  url: string
  mimeType: string
  size: number
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string | Date
  category: Category
  receipts?: Receipt[]
}

interface TransactionListProps {
  transactions?: Transaction[]
  onDelete?: () => void
}

export default function TransactionList({ transactions: propTransactions, onDelete }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(!propTransactions)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions)
      setLoading(false)
    } else {
      fetchTransactions()
    }
  }, [propTransactions])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?limit=50')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/transactions/${transactionToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Transação deletada com sucesso!', 'success')
        setTransactions(transactions.filter(t => t.id !== transactionToDelete.id))
        if (onDelete) {
          onDelete()
        }
        setDeleteModalOpen(false)
        setTransactionToDelete(null)
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao deletar transação', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
      showToast('Erro ao deletar transação', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTransaction key={i} />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card variant="glass" padding="lg">
        <EmptyState
          icon={<Receipt className="w-full h-full" />}
          title="Nenhuma transação encontrada"
          description="Tente ajustar os filtros de busca ou adicione uma nova transação"
        />
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {transactions.map((transaction, index) => {
          const isIncome = transaction.type === 'INCOME'
          return (
            <Card
              key={transaction.id}
              variant="default"
              padding="md"
              hover
              className="animate-fade-in group active:scale-[0.98]"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isIncome 
                        ? 'bg-success-50 text-success-600' 
                        : 'bg-danger-50 text-danger-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpCircle className="w-6 h-6" />
                    ) : (
                      <ArrowDownCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 truncate text-base">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-secondary-400 mt-1">
                      <span>{transaction.category.name}</span>
                      <span>•</span>
                      <span>{formatDateShort(transaction.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Indicador de comprovante */}
                  {transaction.receipts && transaction.receipts.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedReceipt(transaction.receipts![0])
                        setReceiptModalOpen(true)
                      }}
                      className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all touch-feedback active:scale-95"
                      title={`Ver comprovante (${transaction.receipts.length})`}
                      aria-label="Ver comprovante"
                    >
                      <FileImage className="w-5 h-5" />
                    </button>
                  )}
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        isIncome 
                          ? 'text-success-600' 
                          : 'text-danger-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(transaction)}
                    className="p-2 text-secondary-300 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all touch-feedback active:scale-95 opacity-0 group-hover:opacity-100"
                    title="Deletar transação"
                    aria-label="Deletar transação"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

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
              Tem certeza que deseja deletar a transação <strong>"{transactionToDelete.description}"</strong>?
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

      {/* Modal de Visualização de Comprovante */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false)
          setSelectedReceipt(null)
        }}
        title="Comprovante"
        size="lg"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-secondary-900">
                    {selectedReceipt.originalFilename}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {(selectedReceipt.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <a
                href={selectedReceipt.url}
                download={selectedReceipt.originalFilename}
                className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
            
            <div className="bg-secondary-50 rounded-xl p-4 min-h-[400px] flex items-center justify-center">
              {selectedReceipt.mimeType.startsWith('image/') ? (
                <img
                  src={selectedReceipt.url}
                  alt={selectedReceipt.originalFilename}
                  className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center">
                  <FileImage className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600 mb-4">
                    Visualização de PDF não disponível
                  </p>
                  <a
                    href={selectedReceipt.url}
                    download={selectedReceipt.originalFilename}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
