'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  type: 'transactions' | 'report'
  format?: 'csv' | 'xlsx'
  startDate?: string
  endDate?: string
  transactionType?: string
  className?: string
}

export default function ExportButton({
  type,
  format = 'xlsx',
  startDate,
  endDate,
  transactionType,
  className = '',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)

      const params = new URLSearchParams()
      params.append('format', format)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (transactionType && transactionType !== 'ALL') {
        params.append('type', transactionType)
      }

      const endpoint =
        type === 'transactions'
          ? `/api/export/transactions?${params.toString()}`
          : `/api/export/report?${params.toString()}`

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error('Erro ao exportar dados')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${type}_${new Date().toISOString().split('T')[0]}.${format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  const Icon = format === 'xlsx' ? FileSpreadsheet : FileText
  const label =
    format === 'xlsx'
      ? type === 'transactions'
        ? 'Exportar Excel'
        : 'Exportar Relatório Excel'
      : type === 'transactions'
      ? 'Exportar CSV'
      : 'Exportar Relatório CSV'

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exportando...</span>
        </>
      ) : (
        <>
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}



