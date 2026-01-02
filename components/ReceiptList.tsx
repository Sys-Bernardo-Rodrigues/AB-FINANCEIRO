'use client'

import { useEffect, useState } from 'react'
import { FileImage, FileText, Download, Trash2, X, Eye } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

interface Receipt {
  id: string
  filename: string
  originalFilename: string
  url: string
  mimeType: string
  size: number
  transactionId?: string
  transaction?: {
    id: string
    description: string
    amount: number
    type: string
  }
  uploadedAt: string
}

interface ReceiptListProps {
  transactionId?: string
  onDelete?: (id: string) => void
}

export default function ReceiptList({
  transactionId,
  onDelete,
}: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Receipt | null>(null)

  useEffect(() => {
    fetchReceipts()
  }, [transactionId])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const url = transactionId
        ? `/api/receipts?transactionId=${transactionId}`
        : '/api/receipts'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
      }
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este comprovante?')) {
      return
    }

    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReceipts(receipts.filter((r) => r.id !== id))
        onDelete?.(id)
      }
    } catch (error) {
      console.error('Erro ao deletar comprovante:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary-500">Carregando comprovantes...</div>
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-secondary-500">
        <FileImage className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
        <p>Nenhum comprovante encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-card-hover transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isImage(receipt.mimeType)
                    ? 'bg-primary-50 text-primary-600'
                    : 'bg-secondary-50 text-secondary-600'
                }`}
              >
                {isImage(receipt.mimeType) ? (
                  <FileImage className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900 text-sm truncate">
                  {receipt.originalFilename}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {formatFileSize(receipt.size)} •{' '}
                  {formatDateShort(receipt.uploadedAt)}
                </p>
                {receipt.transaction && (
                  <p className="text-xs text-primary-600 mt-1 truncate">
                    {receipt.transaction.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(receipt)}
                className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver
              </button>
              <a
                href={receipt.url}
                download
                className="px-3 py-2 bg-secondary-50 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-100 transition-colors flex items-center justify-center"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleDelete(receipt.id)}
                className="px-3 py-2 bg-danger-50 text-danger-600 rounded-lg text-sm font-medium hover:bg-danger-100 transition-colors flex items-center justify-center"
                title="Deletar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <h3 className="font-semibold text-secondary-900">
                {preview.originalFilename}
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-secondary-50">
              {isImage(preview.mimeType) ? (
                <img
                  src={preview.url}
                  alt={preview.originalFilename}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600 mb-4">
                    Visualização de PDF não disponível
                  </p>
                  <a
                    href={preview.url}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}






