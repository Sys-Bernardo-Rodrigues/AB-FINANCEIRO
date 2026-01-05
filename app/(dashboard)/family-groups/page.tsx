'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiRequest } from '@/lib/utils/api'
import { Plus, Users, Crown, Mail } from 'lucide-react'

interface FamilyGroup {
  id: string
  name: string
  description?: string
  role: 'ADMIN' | 'MEMBER'
  members: Array<{
    id: string
    userName: string
    userEmail: string
    role: 'ADMIN' | 'MEMBER'
  }>
}

export default function FamilyGroupsPage() {
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<FamilyGroup[]>('/family-groups')
      setGroups(data)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/family-groups', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setFormData({ name: '', description: '' })
      setShowForm(false)
      loadGroups()
    } catch (error) {
      console.error('Erro ao criar grupo:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar grupo')
    }
  }

  const addMember = async (groupId: string, email: string) => {
    try {
      await apiRequest(`/family-groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userEmail: email }),
      })
      loadGroups()
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      alert('Erro ao adicionar membro')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grupos de Família</h1>
          <p className="text-slate-600 mt-1">
            Compartilhe finanças com sua família
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Novo Grupo
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Criar Novo Grupo
            </h2>
            <Input
              label="Nome do Grupo"
              placeholder="Ex: Família Silva"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Descreva o grupo"
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
                  setFormData({ name: '', description: '' })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Grupo
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhum grupo criado</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Criar Primeiro Grupo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {group.name}
                      {group.role === 'ADMIN' && (
                        <Crown className="w-5 h-5 text-warning-500" />
                      )}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`badge ${
                    group.role === 'ADMIN' ? 'badge-warning' : 'badge-info'
                  }`}
                >
                  {group.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">
                    Membros ({group.members.length})
                  </h4>
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                            {member.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {member.userName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.userEmail}
                            </p>
                          </div>
                        </div>
                        {member.role === 'ADMIN' && (
                          <Crown className="w-4 h-4 text-warning-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {group.role === 'ADMIN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      const email = prompt('Email do novo membro:')
                      if (email) {
                        addMember(group.id, email)
                      }
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    Adicionar Membro
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

