'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Plus, Edit, Trash2, Users, Mail, Calendar, UserPlus } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<User[]>('/users')
      setUsers(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingUser) {
        // Atualizar usuário
        const updateData: any = {}
        if (formData.name) updateData.name = formData.name
        if (formData.email) updateData.email = formData.email
        if (formData.password) updateData.password = formData.password

        await apiRequest(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
        alert('Usuário atualizado com sucesso!')
      } else {
        // Criar usuário
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        alert('Usuário criado com sucesso!')
      }

      setFormData({ name: '', email: '', password: '' })
      setShowForm(false)
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Não preencher senha
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return

    try {
      await apiRequest(`/users/${id}`, { method: 'DELETE' })
      alert('Usuário excluído com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', email: '', password: '' })
    setShowForm(false)
    setEditingUser(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Gerenciar Usuários</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setFormData({ name: '', email: '', password: '' })
            setShowForm(true)
          }}
          size="sm"
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Novo Usuário
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">
            {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 sm:p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm animate-slide-down">
                {error}
              </div>
            )}

            <Input
              label="Nome"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required={!editingUser}
            />

            <Input
              label="Email"
              type="email"
              placeholder="usuario@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required={!editingUser}
            />

            <Input
              label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              type="password"
              placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Mínimo 6 caracteres'}
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              required={!editingUser}
              minLength={editingUser ? undefined : 6}
            />

            <div className="flex gap-3 sm:gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                fullWidth
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={submitting} fullWidth className="sm:w-auto">
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de usuários */}
      {users.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center text-slate-600">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm sm:text-base">Nenhum usuário encontrado. Crie um para começar!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {users.map((user) => (
            <Card key={user.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm sm:text-base font-semibold shadow-md flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Criado em {formatDate(user.createdAt)}</span>
                </div>
                {user.updatedAt !== user.createdAt && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Atualizado em {formatDate(user.updatedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}




