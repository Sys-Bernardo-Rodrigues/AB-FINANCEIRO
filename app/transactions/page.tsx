'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import TransactionList from '@/components/TransactionList'
import TransactionFilters, { FilterState } from '@/components/TransactionFilters'
import AuthGuard from '@/components/AuthGuard'
import ExportButton from '@/components/ExportButton'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'ALL',
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  })

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.type !== 'ALL') {
        params.append('type', filters.type)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }
      if (filters.minAmount) {
        params.append('minAmount', filters.minAmount)
      }
      if (filters.maxAmount) {
        params.append('maxAmount', filters.maxAmount)
      }

      const response = await fetch(`/api/transactions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Todas as Transações
            </h1>
            <div className="flex gap-2">
              <ExportButton
                type="transactions"
                format="csv"
                startDate={filters.startDate}
                endDate={filters.endDate}
                transactionType={filters.type}
                className="hidden sm:flex"
              />
              <ExportButton
                type="transactions"
                format="xlsx"
                startDate={filters.startDate}
                endDate={filters.endDate}
                transactionType={filters.type}
              />
            </div>
          </div>
          
          <TransactionFilters onFilterChange={handleFilterChange} />
          
          {loading ? (
            <div className="flex items-center justify-center py-12 mt-6">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <TransactionList transactions={transactions} />
            </div>
          )}
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
