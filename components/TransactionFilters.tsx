'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar, DollarSign, Tag } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialType?: 'INCOME' | 'EXPENSE' | 'ALL'
}

export interface FilterState {
  search: string
  type: 'INCOME' | 'EXPENSE' | 'ALL'
  categoryId: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
}

export default function TransactionFilters({ onFilterChange, initialType = 'ALL' }: TransactionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: initialType,
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      type: initialType,
      categoryId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    }
    setFilters(clearedFilters)
  }

  const hasActiveFilters = 
    filters.search ||
    filters.type !== initialType ||
    filters.categoryId ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Botão de Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl font-semibold transition-all touch-manipulation flex items-center gap-2 ${
            hasActiveFilters
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="bg-white text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              !
            </span>
          )}
        </button>
      </div>

      {/* Painel de Filtros Avançados */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary-600" />
              Filtros Avançados
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpar filtros
              </button>
            )}
          </div>

          {/* Tipo de Transação */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateFilter('type', 'ALL')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
                  filters.type === 'ALL'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => updateFilter('type', 'INCOME')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
                  filters.type === 'INCOME'
                    ? 'bg-success-600 text-white shadow-md'
                    : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
                }`}
              >
                Receitas
              </button>
              <button
                type="button"
                onClick={() => updateFilter('type', 'EXPENSE')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
                  filters.type === 'EXPENSE'
                    ? 'bg-danger-600 text-white shadow-md'
                    : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
                }`}
              >
                Despesas
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              Categoria
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <select
                value={filters.categoryId}
                onChange={(e) => updateFilter('categoryId', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
              >
                <option value="">Todas as categorias</option>
                {categories
                  .filter((cat) => filters.type === 'ALL' || cat.type === filters.type)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Período de Data */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  max={filters.endDate || undefined}
                  className="w-full px-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Data Final</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  min={filters.startDate || undefined}
                  className="w-full px-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
              </div>
            </div>
          </div>

          {/* Faixa de Valores */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Valor Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter('minAmount', e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter('maxAmount', e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

