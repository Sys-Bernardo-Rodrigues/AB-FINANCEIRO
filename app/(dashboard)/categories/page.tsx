'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiRequest } from '@/lib/utils/api'
import { Plus, Tag, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  type: 'INCOME' | 'EXPENSE'
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Category[]>('/categories')
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await apiRequest(`/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
      } else {
        await apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
      }
      setFormData({ name: '', description: '', type: 'EXPENSE' })
      setShowForm(false)
      setEditingId(null)
      loadCategories()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao salvar categoria'
      )
    }
  }

  const editCategory = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    try {
      await apiRequest(`/categories/${id}`, { method: 'DELETE' })
      loadCategories()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria')
    }
  }

  const incomeCategories = categories.filter((c) => c.type === 'INCOME')
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Categorias</h1>
          <p className="text-slate-600 mt-1">
            Gerencie suas categorias de receitas e despesas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Nova Categoria
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingId ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: 'INCOME' }))
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'INCOME'
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ArrowUpCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Receita</p>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: 'EXPENSE' }))
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'EXPENSE'
                    ? 'border-danger-500 bg-danger-50 text-danger-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ArrowDownCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">Despesa</p>
              </button>
            </div>
            <Input
              label="Nome da Categoria"
              placeholder="Ex: Alimentação"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Descreva a categoria"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ name: '', description: '', type: 'EXPENSE' })
                  setEditingId(null)
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receitas */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ArrowUpCircle className="w-6 h-6 text-success-600" />
              Receitas ({incomeCategories.length})
            </h2>
            {incomeCategories.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                Nenhuma categoria de receita
              </Card>
            ) : (
              <div className="space-y-3">
                {incomeCategories.map((category) => (
                  <Card key={category.id} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center text-success-600">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-sm text-slate-500">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCategory(category)}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Despesas */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ArrowDownCircle className="w-6 h-6 text-danger-600" />
              Despesas ({expenseCategories.length})
            </h2>
            {expenseCategories.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                Nenhuma categoria de despesa
              </Card>
            ) : (
              <div className="space-y-3">
                {expenseCategories.map((category) => (
                  <Card key={category.id} hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center text-danger-600">
                          <Tag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-sm text-slate-500">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCategory(category)}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

