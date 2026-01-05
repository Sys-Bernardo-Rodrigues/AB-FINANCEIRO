'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { apiRequest } from '@/lib/utils/api'
import { Settings as SettingsIcon, User, Bell, Download, RefreshCw, CheckCircle, AlertCircle, ExternalLink, GitBranch } from 'lucide-react'

interface UpdateInfo {
  currentVersion: string
  currentCommit?: string
  hasUpdates: boolean
  latestCommit?: string
  latestVersion?: string
  commitsBehind?: number
  branch?: string
  lastChecked?: string
  error?: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateSteps, setUpdateSteps] = useState<Array<{ step: string; status: 'success' | 'error'; message: string }>>([])
  const [showUpdateProgress, setShowUpdateProgress] = useState(false)

  useEffect(() => {
    checkForUpdates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkForUpdates = async () => {
    setCheckingUpdates(true)
    try {
      const info = await apiRequest<UpdateInfo>('/system/check-updates')
      setUpdateInfo(info)
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error)
      setUpdateInfo({
        currentVersion: '2.0.0',
        hasUpdates: false,
        error: 'Não foi possível verificar atualizações',
      })
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleUpdate = async () => {
    if (!confirm('Tem certeza que deseja atualizar o sistema? Isso pode levar alguns minutos e pode reiniciar o servidor.')) {
      return
    }

    setUpdating(true)
    setShowUpdateProgress(true)
    setUpdateSteps([])

    try {
      const response = await apiRequest<{
        success: boolean
        message: string
        steps: Array<{ step: string; status: 'success' | 'error'; message: string }>
        requiresRestart?: boolean
      }>('/system/update', {
        method: 'POST',
      })

      setUpdateSteps(response.steps || [])

      if (response.success) {
        alert('Sistema atualizado com sucesso! A página será recarregada em alguns segundos.')
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        alert('Erro ao atualizar o sistema. Verifique os logs para mais detalhes.')
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      alert('Erro ao atualizar o sistema. Tente novamente ou use o método manual.')
    } finally {
      setUpdating(false)
    }
  }

  const getShortCommit = (commit?: string) => {
    if (!commit) return 'N/A'
    return commit.substring(0, 7)
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-600 mt-1">Gerencie suas preferências</p>
      </div>

      {/* Perfil */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Perfil</h2>
            <p className="text-sm text-slate-600">Informações da sua conta</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <div className="input bg-slate-50 cursor-not-allowed">
              {user?.name}
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="input bg-slate-50 cursor-not-allowed">
              {user?.email}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Para alterar suas informações, entre em contato com o suporte.
          </p>
        </div>
      </Card>

      {/* Notificações */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Notificações</h2>
            <p className="text-sm text-slate-600">
              Configure como deseja receber notificações
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Notificações de Transações</p>
              <p className="text-sm text-slate-600">
                Receba alertas sobre novas transações
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Notificações de Metas</p>
              <p className="text-sm text-slate-600">
                Avisos sobre progresso das suas metas
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Atualização do Sistema */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white flex-shrink-0">
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Atualização do Sistema</h2>
            <p className="text-xs sm:text-sm text-slate-600">Verifique e atualize o sistema do GitHub</p>
          </div>
        </div>

        {updateInfo && (
          <div className="space-y-4">
            {/* Versão Atual */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Versão Atual</span>
                <span className="text-sm font-bold text-slate-800">{updateInfo.currentVersion}</span>
              </div>
              {updateInfo.currentCommit && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {updateInfo.branch || 'main'}
                  </span>
                  <span className="font-mono">{getShortCommit(updateInfo.currentCommit)}</span>
                </div>
              )}
            </div>

            {/* Status de Atualização */}
            {updateInfo.hasUpdates ? (
              <div className="p-3 sm:p-4 bg-warning-50 border border-warning-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warning-800 mb-1">Atualizações Disponíveis!</p>
                    {updateInfo.latestVersion && updateInfo.latestVersion !== updateInfo.currentVersion && (
                      <p className="text-sm text-warning-700 mb-2">
                        Nova versão: <strong>{updateInfo.latestVersion}</strong>
                      </p>
                    )}
                    {updateInfo.commitsBehind && updateInfo.commitsBehind > 0 && (
                      <p className="text-xs text-warning-600 mb-3">
                        {updateInfo.commitsBehind} commit{updateInfo.commitsBehind > 1 ? 's' : ''} atrás
                      </p>
                    )}
                    <Button
                      onClick={handleUpdate}
                      isLoading={updating}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Atualizar Sistema
                    </Button>
                  </div>
                </div>
              </div>
            ) : updateInfo.error ? (
              <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600">{updateInfo.error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-success-50 border border-success-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-success-800">Sistema Atualizado</p>
                    <p className="text-xs text-success-700 mt-1">
                      Você está usando a versão mais recente do sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progresso da Atualização */}
            {showUpdateProgress && updateSteps.length > 0 && (
              <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-sm font-medium text-slate-800 mb-2">Progresso da Atualização:</p>
                {updateSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs sm:text-sm ${
                      step.status === 'success' ? 'text-success-700' : 'text-danger-700'
                    }`}
                  >
                    {step.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium capitalize">{step.step}:</span>
                    <span>{step.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={checkForUpdates}
                isLoading={checkingUpdates}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checkingUpdates ? 'animate-spin' : ''}`} />
                Verificar Atualizações
              </Button>
              <a
                href="https://github.com/Sys-Bernardo-Rodrigues/AB-FINANCEIRO"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no GitHub
                </Button>
              </a>
            </div>

            {updateInfo.lastChecked && (
              <p className="text-xs text-slate-500 text-center">
                Última verificação: {new Date(updateInfo.lastChecked).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}

        {!updateInfo && !checkingUpdates && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={checkForUpdates} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Atualizações
            </Button>
          </div>
        )}
      </Card>

      {/* Sobre */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white flex-shrink-0">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Sobre</h2>
            <p className="text-xs sm:text-sm text-slate-600">Informações do sistema</p>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">AB Financeiro</strong> - Sistema
            de controle financeiro pessoal
          </p>
          <p>
            Versão {updateInfo?.currentVersion || '2.0.0'}
          </p>
          <p className="pt-3 sm:pt-4 border-t border-slate-200">
            © 2026 AB Financeiro. Todos os direitos reservados.
          </p>
        </div>
      </Card>
    </div>
  )
}

