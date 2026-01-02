'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Edit2, Trash2, X, Save } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingUser) {
        // Atualizar usuário
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao atualizar usuário')
        }

        setSuccess('Usuário atualizado com sucesso!')
      } else {
        // Criar usuário
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao criar usuário')
        }

        setSuccess('Usuário criado com sucesso!')
      }

      resetForm()
      loadUsers()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário')
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
    })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar usuário')
      }

      setSuccess('Usuário deletado com sucesso!')
      loadUsers()
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar usuário')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' })
    setEditingUser(null)
    setShowForm(false)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
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
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <button
              onClick={resetForm}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Senha {editingUser && '(deixe em branco para não alterar)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                required={!editingUser}
                minLength={6}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium touch-manipulation"
              >
                <Save className="w-4 h-4" />
                <span>{editingUser ? 'Salvar Alterações' : 'Criar Usuário'}</span>
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

      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-secondary-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900">{user.name}</div>
                          <div className="text-sm text-secondary-500 sm:hidden">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-700 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

