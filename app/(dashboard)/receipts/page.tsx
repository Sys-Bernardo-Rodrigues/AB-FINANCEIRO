'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest, apiRequestFormData } from '@/lib/utils/api'
import { Plus, FileText, Download, Trash2, Image as ImageIcon } from 'lucide-react'

interface Receipt {
  id: string
  filename: string
  originalFilename: string
  url: string
  mimeType: string
  size: number
  uploadedAt: string
  transaction?: {
    id: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
  }
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadReceipts()
    loadTransactions()
  }, [])

  const loadReceipts = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Receipt[]>('/receipts')
      setReceipts(data)
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await apiRequest<Transaction[]>('/transactions?limit=100')
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedTransaction) {
        formData.append('transactionId', selectedTransaction)
      }

      await apiRequestFormData('/receipts', formData)
      setSelectedTransaction('')
      setShowForm(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      loadReceipts()
      alert('Comprovante enviado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao fazer upload do comprovante'
      )
    } finally {
      setUploading(false)
    }
  }

  const deleteReceipt = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comprovante?')) return
    try {
      await apiRequest(`/receipts/${id}`, { method: 'DELETE' })
      loadReceipts()
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Comprovantes</h1>
          <p className="text-slate-600 mt-1">
            Gerencie seus comprovantes e documentos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Enviar Comprovante
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Enviar Comprovante
          </h2>
          <div className="space-y-4">
            <Select
              label="Vincular a Transação (opcional)"
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              options={[
                { value: '', label: 'Nenhuma' },
                ...transactions.map((t) => ({
                  value: t.id,
                  label: `${t.description} - ${formatCurrency(t.amount)}`,
                })),
              ]}
            />
            <div>
              <label className="label">Arquivo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="input"
                disabled={uploading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
              </p>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
                <span className="text-sm">Enviando...</span>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false)
                setSelectedTransaction('')
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              fullWidth
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : receipts.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhum comprovante enviado</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Enviar Primeiro Comprovante
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                  {isImage(receipt.mimeType) ? (
                    <ImageIcon className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <button
                  onClick={() => deleteReceipt(receipt.id)}
                  className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-danger-600" />
                </button>
              </div>
              <h3 className="font-medium text-slate-800 mb-2 truncate">
                {receipt.originalFilename}
              </h3>
              {receipt.transaction && (
                <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Transação vinculada</p>
                  <p className="text-sm font-medium text-slate-800">
                    {receipt.transaction.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(receipt.transaction.amount)}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>{formatFileSize(receipt.size)}</span>
                <span>{formatDate(receipt.uploadedAt)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => window.open(receipt.url, '_blank')}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}




