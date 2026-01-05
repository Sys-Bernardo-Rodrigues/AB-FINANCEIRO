'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { ArrowLeft, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, Plus, FileText, Download, X, Image as ImageIcon } from 'lucide-react'
import { apiRequestFormData } from '@/lib/utils/api'

interface Receipt {
  id: string
  filename: string
  originalFilename: string
  url: string
  mimeType: string
  size: number
  uploadedAt: string
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    id: string
    name: string
  }
  date: string
  isScheduled: boolean
  scheduledDate?: string
  creditCard?: {
    id: string
    name: string
  }
  plan?: {
    id: string
    name: string
  }
  receipts?: Receipt[]
}

export default function TransactionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTransaction()
  }, [id])

  const loadTransaction = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Transaction>(`/transactions/${id}`)
      setTransaction(data)
    } catch (error) {
      console.error('Erro ao carregar transação:', error)
      router.push('/transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('transactionId', id)

      await apiRequestFormData('/receipts', formData)
      setShowUploadForm(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      loadTransaction()
      alert('Comprovante enviado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Erro ao fazer upload do comprovante'
      )
    } finally {
      setUploading(false)
    }
  }

  const deleteReceipt = async (receiptId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comprovante?')) return
    try {
      await apiRequest(`/receipts/${receiptId}`, { method: 'DELETE' })
      loadTransaction()
    } catch (error) {
      console.error('Erro ao excluir comprovante:', error)
      alert('Erro ao excluir comprovante')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith('image/')
  }

  const deleteTransaction = async () => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' })
      router.push('/transactions')
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  if (loading || !transaction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">Detalhes</h1>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/transactions/${id}/edit`)}
        >
          <Edit className="w-5 h-5" />
        </Button>
        <Button variant="ghost" onClick={deleteTransaction}>
          <Trash2 className="w-5 h-5 text-danger-600" />
        </Button>
      </div>

      {/* Card principal */}
      <Card>
        <div className="flex items-center gap-6 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              transaction.type === 'INCOME'
                ? 'bg-success-100 text-success-600'
                : 'bg-danger-100 text-danger-600'
            }`}
          >
            {transaction.type === 'INCOME' ? (
              <ArrowUpCircle className="w-8 h-8" />
            ) : (
              <ArrowDownCircle className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">
              {transaction.description}
            </h2>
            <p className="text-slate-600 mt-1">{transaction.category.name}</p>
          </div>
          <div className="text-right">
            <p
              className={`text-3xl font-bold ${
                transaction.type === 'INCOME'
                  ? 'text-success-600'
                  : 'text-danger-600'
              }`}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-600">Data</span>
            <span className="font-medium text-slate-800">
              {formatDate(transaction.date)}
            </span>
          </div>

          {transaction.isScheduled && transaction.scheduledDate && (
            <div className="flex justify-between">
              <span className="text-slate-600">Data Agendada</span>
              <span className="font-medium text-slate-800">
                {formatDate(transaction.scheduledDate)}
              </span>
            </div>
          )}

          {transaction.creditCard && (
            <div className="flex justify-between">
              <span className="text-slate-600">Cartão de Crédito</span>
              <span className="font-medium text-slate-800">
                {transaction.creditCard.name}
              </span>
            </div>
          )}

          {transaction.plan && (
            <div className="flex justify-between">
              <span className="text-slate-600">Planejamento</span>
              <span className="font-medium text-slate-800">
                {transaction.plan.name}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-600">Tipo</span>
            <span className={`badge ${
              transaction.type === 'INCOME' ? 'badge-success' : 'badge-danger'
            }`}>
              {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
            </span>
          </div>
        </div>
      </Card>

      {/* Comprovantes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Comprovantes ({transaction.receipts?.length || 0})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {showUploadForm && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="input mb-2"
              disabled={uploading}
            />
            <p className="text-xs text-slate-500 mb-2">
              Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
            </p>
            {uploading && (
              <div className="flex items-center gap-2 text-primary-600 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
                <span>Enviando...</span>
              </div>
            )}
          </div>
        )}

        {transaction.receipts && transaction.receipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transaction.receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    {isImage(receipt.mimeType) ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {receipt.originalFilename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(receipt.size)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => window.open(receipt.url, '_blank')}
                    className="p-2 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-primary-600" />
                  </button>
                  <button
                    onClick={() => deleteReceipt(receipt.id)}
                    className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                    title="Excluir"
                  >
                    <X className="w-4 h-4 text-danger-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Nenhum comprovante anexado
          </div>
        )}
      </Card>
    </div>
  )
}

