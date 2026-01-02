'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import IOSInstallModal from './IOSInstallModal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar se está em modo standalone (iOS)
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // Para iOS, mostrar prompt após 5 segundos (não há evento beforeinstallprompt)
    if (isIOS) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 5000)
      }
      return
    }

    // Escutar evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostrar prompt após 3 segundos
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verificar se foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Para iOS, mostrar modal com instruções
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setShowIOSModal(true)
        setShowPrompt(false)
      }
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação')
        setIsInstalled(true)
      } else {
        console.log('Usuário rejeitou a instalação')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Salvar no localStorage para não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  // Verificar se já foi dispensado
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setShowPrompt(false)
      }
    }
  }, [])
  
  // Para iOS, mostrar mesmo sem deferredPrompt
  if (isInstalled) {
    return null
  }
  
  // Para Android/Chrome, só mostrar se tiver deferredPrompt
  if (!isIOS && (!showPrompt || !deferredPrompt)) {
    return null
  }
  
  // Para iOS, verificar se showPrompt está ativo
  if (isIOS && !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-4 animate-slide-up">
      <div className="glass rounded-2xl shadow-elevated p-4 border border-secondary-200/50 backdrop-blur-xl max-w-md mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900">
                {isIOS ? 'Adicionar à Tela Inicial' : 'Instalar App'}
              </h3>
              <p className="text-sm text-secondary-600">
                {isIOS 
                  ? 'Adicione este app à sua tela inicial para acesso rápido'
                  : 'Instale para acesso rápido e uso offline'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-secondary-400 hover:text-secondary-600 p-1 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all duration-300 ease-in-out hover-lift"
          >
            {isIOS ? 'Como Instalar' : 'Instalar'}
          </button>
          <button
            onClick={handleDismiss}
            className="py-2.5 px-4 rounded-xl font-semibold text-secondary-700 bg-secondary-100 hover:bg-secondary-200 transition-all duration-300"
          >
            Agora não
          </button>
        </div>
      </div>
      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </div>
  )
}


