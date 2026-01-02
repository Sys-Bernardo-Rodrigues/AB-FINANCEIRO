'use client'

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import ReceiptList from '@/components/ReceiptList'
import ReceiptUpload from '@/components/ReceiptUpload'
import { useState } from 'react'

export default function ReceiptsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Forçar atualização da lista
    setRefreshKey((prev) => prev + 1)
  }

  const handleError = (error: string) => {
    alert(error)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-secondary-50 pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Comprovantes
            </h1>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-secondary-200 shadow-card mb-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Enviar Novo Comprovante
            </h2>
            <ReceiptUpload
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
          </div>

          <ReceiptList key={refreshKey} />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

