'use client'

import { X, Share2, Plus, Check } from 'lucide-react'

interface IOSInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-3xl shadow-elevated p-6 sm:p-8 border border-secondary-200/50 backdrop-blur-xl max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900">
            Instalar no iPhone
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 p-1 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-secondary-700">
            Siga estes passos para adicionar o app à sua tela inicial:
          </p>

          <div className="space-y-4">
            {/* Passo 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">1</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Share2 className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-secondary-900">
                    Toque no botão de compartilhar
                  </h3>
                </div>
                <p className="text-sm text-secondary-600">
                  Na barra inferior do Safari, toque no ícone de compartilhar (caixa com seta para cima)
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">2</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Plus className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-secondary-900">
                    Selecione "Adicionar à Tela de Início"
                  </h3>
                </div>
                <p className="text-sm text-secondary-600">
                  Role para baixo no menu e encontre a opção "Adicionar à Tela de Início"
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">3</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-secondary-900">
                    Toque em "Adicionar"
                  </h3>
                </div>
                <p className="text-sm text-secondary-600">
                  Confirme a instalação tocando em "Adicionar" no canto superior direito
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm text-primary-800">
              <strong>Dica:</strong> Após a instalação, o app aparecerá na sua tela inicial e funcionará como um app nativo, com acesso offline!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all duration-300 ease-in-out hover-lift"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}


