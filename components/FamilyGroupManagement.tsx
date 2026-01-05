'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, UserPlus, UserMinus, Crown, User } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

interface FamilyGroupMember {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
}

interface FamilyGroup {
  id: string
  name: string
  description?: string
  createdBy: string
  role: 'ADMIN' | 'MEMBER'
  members: FamilyGroupMember[]
  createdAt: string
  updatedAt: string
}

export default function FamilyGroupManagement() {
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null)
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [memberEmail, setMemberEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/family-groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (err) {
      console.error('Erro ao carregar grupos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingGroup) {
        // Atualizar grupo
        const response = await fetch(`/api/family-groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao atualizar grupo')
        }

        showToast('Grupo atualizado com sucesso!', 'success')
      } else {
        // Criar grupo
        const response = await fetch('/api/family-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao criar grupo')
        }

        showToast('Grupo criado com sucesso!', 'success')
      }

      resetForm()
      loadGroups()
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar grupo'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedGroup) return

    try {
      const response = await fetch(`/api/family-groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: memberEmail }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao adicionar membro')
      }

      showToast('Membro adicionado com sucesso!', 'success')
      setMemberEmail('')
      setShowAddMemberModal(false)
      setSelectedGroup(null)
      loadGroups()
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao adicionar membro'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    }
  }

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro do grupo?')) {
      return
    }

    try {
      const response = await fetch(`/api/family-groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao remover membro')
      }

      showToast('Membro removido com sucesso!', 'success')
      loadGroups()
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover membro'
      showToast(errorMessage, 'error')
    }
  }

  const handleEdit = (group: FamilyGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
    })
    setShowForm(true)
    setError('')
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<FamilyGroup | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    const group = groups.find(g => g.id === id)
    if (group) {
      setGroupToDelete(group)
      setDeleteModalOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/family-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar grupo')
      }

      showToast('Grupo deletado com sucesso!', 'success')
      loadGroups()
      setDeleteModalOpen(false)
      setGroupToDelete(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar grupo'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingGroup(null)
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-secondary-900">Grupos de Família</h2>
          <p className="text-sm text-secondary-500 mt-1">
            Gerencie grupos de família para compartilhar informações financeiras
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          leftIcon={<Plus className="w-5 h-5" />}
          variant="primary"
        >
          Novo Grupo
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
        title={editingGroup ? 'Editar Grupo' : 'Novo Grupo de Família'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Grupo"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Família Silva"
            required
          />

          <Input
            label="Descrição (opcional)"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição do grupo"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
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

      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false)
          setSelectedGroup(null)
          setMemberEmail('')
          setError('')
        }}
        title="Adicionar Membro"
        size="sm"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input
            label="Email do Usuário"
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="usuario@email.com"
            required
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              Adicionar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowAddMemberModal(false)
                setSelectedGroup(null)
                setMemberEmail('')
                setError('')
              }}
              variant="secondary"
              fullWidth
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {groups.length === 0 ? (
        <Card variant="glass" padding="lg">
          <EmptyState
            icon={<Users className="w-full h-full" />}
            title="Nenhum grupo de família encontrado"
            description="Crie um grupo para compartilhar informações financeiras com sua família"
            actionLabel="Criar Grupo"
            onAction={() => {
              resetForm()
              setShowForm(true)
            }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id} variant="default" padding="md" hover>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-secondary-900">{group.name}</h3>
                      {group.role === 'ADMIN' && (
                        <Crown className="w-5 h-5 text-primary-600" title="Administrador" />
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-secondary-500">{group.description}</p>
                    )}
                    <p className="text-xs text-secondary-400 mt-1">
                      {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                    </p>
                  </div>
                  {group.role === 'ADMIN' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors touch-manipulation active:scale-95"
                        title="Editar"
                        aria-label="Editar grupo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-xl transition-colors touch-manipulation active:scale-95"
                        title="Deletar"
                        aria-label="Deletar grupo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-secondary-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-secondary-700">Membros</h4>
                    {group.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowAddMemberModal(true)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation active:scale-95"
                      >
                        <UserPlus className="w-4 h-4" />
                        Adicionar
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {member.role === 'ADMIN' ? (
                              <Crown className="w-5 h-5 text-primary-600" />
                            ) : (
                              <User className="w-5 h-5 text-primary-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-secondary-900 truncate">
                                {member.userName}
                              </p>
                              {member.role === 'ADMIN' && (
                                <span className="text-xs text-primary-600 font-semibold">Admin</span>
                              )}
                            </div>
                            <p className="text-xs text-secondary-500 truncate">{member.userEmail}</p>
                          </div>
                        </div>
                        {group.role === 'ADMIN' && member.userId !== group.createdBy && (
                          <button
                            onClick={() => handleRemoveMember(group.id, member.userId)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation active:scale-95"
                            title="Remover membro"
                            aria-label="Remover membro"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false)
            setGroupToDelete(null)
          }
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        {groupToDelete && (
          <div className="space-y-4">
            <p className="text-secondary-700">
              Tem certeza que deseja deletar o grupo <strong>"{groupToDelete.name}"</strong>?
            </p>
            <p className="text-sm text-secondary-500">
              Esta ação não pode ser desfeita. Todos os membros serão removidos do grupo.
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
                  setGroupToDelete(null)
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

