'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

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

        showToast('Usuário atualizado com sucesso!', 'success')
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

        showToast('Usuário criado com sucesso!', 'success')
      }

      resetForm()
      loadUsers()
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar usuário'
      setError(errorMessage)
      showToast(errorMessage, 'error')
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (user) {
      setUserToDelete(user)
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar usuário')
      }

      showToast('Usuário deletado com sucesso!', 'success')
      loadUsers()
      setDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar usuário'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' })
    setEditingUser(null)
    setShowForm(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900">Gerenciar Usuários</h2>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          leftIcon={<Plus className="w-5 h-5" />}
          variant="primary"
        >
          Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome completo"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            required
          />

          <Input
            label="Senha"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required={!editingUser}
            minLength={6}
            helperText={editingUser ? 'Deixe em branco para não alterar' : 'Mínimo de 6 caracteres'}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              leftIcon={<Save className="w-4 h-4" />}
              variant="primary"
              fullWidth
            >
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
            <Button
              type="button"
              onClick={resetForm}
              variant="secondary"
              fullWidth
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {users.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            icon={<User className="w-full h-full" />}
            title="Nenhum usuário encontrado"
            description="Comece criando um novo usuário"
            actionLabel="Criar Usuário"
            onAction={() => {
              resetForm()
              setShowForm(true)
            }}
          />
        </Card>
      ) : (
        <Card variant="default" padding="none">
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                          aria-label="Editar usuário"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                          title="Deletar"
                          aria-label="Deletar usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false)
            setUserToDelete(null)
          }
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        {userToDelete && (
          <div className="space-y-4">
            <p className="text-secondary-700">
              Tem certeza que deseja deletar o usuário <strong>"{userToDelete.name}"</strong>?
            </p>
            <p className="text-sm text-secondary-500">
              Esta ação não pode ser desfeita. Todas as transações e dados relacionados serão mantidos.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={deleting}
                fullWidth
              >
                Deletar
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setUserToDelete(null)
                }}
                disabled={deleting}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

