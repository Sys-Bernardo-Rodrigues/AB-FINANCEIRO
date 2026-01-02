'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileImage, FileText, Loader2, Check } from 'lucide-react'

interface ReceiptUploadProps {
  transactionId?: string
  onUploadComplete?: (receipt: any) => void
  onError?: (error: string) => void
}

export default function ReceiptUpload({
  transactionId,
  onUploadComplete,
  onError,
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('Arquivo muito grande. Tamanho máximo: 10MB')
      return
    }

    // Validar tipo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      onError?.('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou PDF')
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setUploaded(false)

      const formData = new FormData()
      formData.append('file', file)
      if (transactionId) {
        formData.append('transactionId', transactionId)
      }

      const response = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const receipt = await response.json()
      setUploaded(true)
      onUploadComplete?.(receipt)

      // Reset após 2 segundos
      setTimeout(() => {
        setUploaded(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)
    } catch (error: any) {
      onError?.(error.message || 'Erro ao fazer upload do comprovante')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = () => {
    return <FileImage className="w-5 h-5" />
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="receipt-upload"
        disabled={uploading}
      />
      <label
        htmlFor="receipt-upload"
        className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all touch-manipulation ${
          uploading
            ? 'border-primary-300 bg-primary-50 cursor-wait'
            : uploaded
            ? 'border-success-300 bg-success-50'
            : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            <span className="text-sm font-medium text-primary-700">
              Enviando...
            </span>
          </>
        ) : uploaded ? (
          <>
            <Check className="w-5 h-5 text-success-600" />
            <span className="text-sm font-medium text-success-700">
              Comprovante enviado!
            </span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700">
              Enviar Comprovante
            </span>
          </>
        )}
      </label>
      <p className="text-xs text-secondary-500 mt-2 text-center">
        JPG, PNG, WEBP ou PDF (máx. 10MB)
      </p>
    </div>
  )
}



