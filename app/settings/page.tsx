'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import Button from '@/components/ui/Button'
import { Download, RefreshCw, CheckCircle, XCircle, AlertCircle, Power } from 'lucide-react'

interface UpdateStep {
  step: string
  status: 'success' | 'error'
  message: string
}

export default function SettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSteps, setUpdateSteps] = useState<UpdateStep[]>([])
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [updateMessage, setUpdateMessage] = useState('')
  
  const [isRestarting, setIsRestarting] = useState(false)
  const [restartStatus, setRestartStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [restartMessage, setRestartMessage] = useState('')

  const handleUpdate = async () => {
    setIsUpdating(true)
    setUpdateSteps([])
    setUpdateStatus('idle')
    setUpdateMessage('')

    try {
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setUpdateStatus('success')
        setUpdateMessage(data.message)
        setUpdateSteps(data.steps || [])
        
        if (data.requiresRestart) {
          setUpdateMessage('Sistema atualizado com sucesso! Reinicie a aplicação para aplicar as mudanças.')
        }
      } else {
        setUpdateStatus('error')
        setUpdateMessage(data.message || 'Erro ao atualizar o sistema')
        setUpdateSteps(data.steps || [])
      }
    } catch (error: any) {
      setUpdateStatus('error')
      setUpdateMessage('Erro ao conectar com o servidor')
      console.error('Erro na atualização:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStepIcon = (status: 'success' | 'error') => {
    if (status === 'success') {
      return <CheckCircle className="w-5 h-5 text-success-600" />
    }
    return <XCircle className="w-5 h-5 text-danger-600" />
  }

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      fetch: 'Buscar atualizações',
      pull: 'Baixar atualizações',
      install: 'Instalar dependências',
      prisma: 'Atualizar Prisma',
    }
    return labels[step] || step
  }

  const handleRestart = async () => {
    if (!confirm('Tem certeza que deseja reiniciar a aplicação? A aplicação ficará temporariamente indisponível.')) {
      return
    }

    setIsRestarting(true)
    setRestartStatus('idle')
    setRestartMessage('')

    try {
      const response = await fetch('/api/system/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setRestartStatus('success')
        setRestartMessage(data.message || 'Aplicação reiniciada com sucesso! A página será recarregada em alguns segundos...')
        
        // Aguardar um pouco e tentar recarregar a página
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setRestartStatus('error')
        if (data.requiresManual && data.instructions) {
          setRestartMessage(`${data.message}\n\nComando para executar no servidor:\n${data.instructions}`)
        } else {
          setRestartMessage(data.message || 'Erro ao reiniciar a aplicação')
        }
      }
    } catch (error: any) {
      setRestartStatus('error')
      setRestartMessage('Erro ao conectar com o servidor. A aplicação pode estar reiniciando...')
      console.error('Erro no restart:', error)
      
      // Se houver erro de conexão, pode ser que o servidor esteja reiniciando
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Configurações
          </h1>
          
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 space-y-4 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-secondary-900">Geral</h2>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-secondary-200">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Moeda</span>
                <span className="text-primary-600 font-semibold">BRL (R$)</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-secondary-200">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Notificações</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
                <span className="text-secondary-700 font-medium mb-1 sm:mb-0">Versão</span>
                <span className="text-secondary-500">1.0.0</span>
              </div>
            </div>

            {/* Atualização do Sistema */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Atualização do Sistema</h2>
                    <p className="text-sm text-secondary-500">Atualizar do repositório GitHub</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleUpdate}
                  isLoading={isUpdating}
                  leftIcon={<RefreshCw className="w-5 h-5" />}
                  fullWidth
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Atualizando...' : 'Atualizar Sistema'}
                </Button>

                {updateStatus !== 'idle' && (
                  <div className={`p-4 rounded-xl border-2 ${
                    updateStatus === 'success' 
                      ? 'bg-success-50 border-success-200' 
                      : 'bg-danger-50 border-danger-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {updateStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          updateStatus === 'success' ? 'text-success-900' : 'text-danger-900'
                        }`}>
                          {updateMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {updateSteps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-secondary-700">Detalhes da atualização:</h3>
                    <div className="space-y-2">
                      {updateSteps.map((step, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            step.status === 'success'
                              ? 'bg-success-50 border-success-200'
                              : 'bg-danger-50 border-danger-200'
                          }`}
                        >
                          {getStepIcon(step.status)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              step.status === 'success' ? 'text-success-900' : 'text-danger-900'
                            }`}>
                              {getStepLabel(step.step)}
                            </p>
                            <p className={`text-xs mt-1 ${
                              step.status === 'success' ? 'text-success-700' : 'text-danger-700'
                            }`}>
                              {step.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {updateStatus === 'success' && (
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-800">
                      <strong>Nota:</strong> Após a atualização, pode ser necessário reiniciar a aplicação para aplicar todas as mudanças.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reinicialização do Sistema */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
                    <Power className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Reinicialização</h2>
                    <p className="text-sm text-secondary-500">Reiniciar a aplicação</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleRestart}
                  isLoading={isRestarting}
                  leftIcon={<Power className="w-5 h-5" />}
                  fullWidth
                  disabled={isRestarting}
                  variant="warning"
                >
                  {isRestarting ? 'Reiniciando...' : 'Reiniciar Aplicação'}
                </Button>

                {restartStatus !== 'idle' && (
                  <div className={`p-4 rounded-xl border-2 ${
                    restartStatus === 'success' 
                      ? 'bg-success-50 border-success-200' 
                      : 'bg-danger-50 border-danger-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {restartStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className={`font-medium whitespace-pre-line ${
                          restartStatus === 'success' ? 'text-success-900' : 'text-danger-900'
                        }`}>
                          {restartMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="text-sm text-warning-800">
                    <strong>Atenção:</strong> A aplicação ficará temporariamente indisponível durante o reinício. Isso geralmente leva alguns segundos.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
