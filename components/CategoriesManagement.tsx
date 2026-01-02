'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Edit2, Trash2, X, Save, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface CategoryData {
  id: string
  name: string
  description: string | null
  type: 'INCOME' | 'EXPENSE'
  createdAt: string
  updatedAt: string
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingCategory) {
        // Atualizar categoria
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao atualizar categoria')
        }

        setSuccess('Categoria atualizada com sucesso!')
      } else {
        // Criar categoria
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao criar categoria')
        }

        setSuccess('Categoria criada com sucesso!')
      }

      resetForm()
      loadCategories()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria')
    }
  }

  const handleEdit = (category: CategoryData) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar categoria')
      }

      setSuccess('Categoria deletada com sucesso!')
      loadCategories()
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar categoria')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'EXPENSE' })
    setEditingCategory(null)
    setShowForm(false)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const filteredCategories = categories.filter(cat => 
    filterType === 'ALL' || cat.type === filterType
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-secondary-900">Gerenciar Categorias</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors text-sm font-medium touch-manipulation w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button
              onClick={resetForm}
              className="text-secondary-400 hover:text-secondary-600 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Tipo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all touch-manipulation ${
                    formData.type === 'INCOME'
                  ? 'bg-success-50 text-success-700 border-2 border-success-200'
                  : 'bg-secondary-50 text-secondary-600 border-2 border-secondary-200'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all touch-manipulation ${
                    formData.type === 'EXPENSE'
                  ? 'bg-danger-50 text-danger-700 border-2 border-danger-200'
                  : 'bg-secondary-50 text-secondary-600 border-2 border-secondary-200'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Despesa
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
                className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium touch-manipulation"
              >
                <Save className="w-4 h-4" />
                <span>{editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3 bg-secondary-100 text-secondary-700 rounded-xl hover:bg-secondary-200 active:bg-secondary-300 transition-colors font-medium touch-manipulation sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all ${
            filterType === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilterType('INCOME')}
          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all flex items-center gap-2 ${
            filterType === 'INCOME'
              ? 'bg-success-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Receitas
        </button>
        <button
          onClick={() => setFilterType('EXPENSE')}
          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all flex items-center gap-2 ${
            filterType === 'EXPENSE'
              ? 'bg-danger-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Despesas
        </button>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="px-4 py-8 text-center text-secondary-500">
            {filterType === 'ALL' 
              ? 'Nenhuma categoria encontrada' 
              : `Nenhuma categoria de ${filterType === 'INCOME' ? 'receita' : 'despesa'} encontrada`}
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="px-4 py-3 hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        category.type === 'INCOME'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}
                    >
                      {category.type === 'INCOME' ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-secondary-900 truncate">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-secondary-500 truncate">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <Link
                      href={`/categories/${category.id}/insights`}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                      title="Ver insights"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

