import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { ArrowRight, Receipt, Tag, Users } from 'lucide-react'

export default function SettingsPage() {
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

            {/* Gerenciamento de Transações */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Transações</h2>
                    <p className="text-sm text-secondary-500">Visualize e delete transações</p>
                  </div>
                </div>
              </div>
              <Link
                href="/transactions/manage"
                className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group hover-lift"
              >
                <span className="font-medium text-primary-700">Abrir Gerenciador de Transações</span>
                <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Gerenciamento de Categorias */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Categorias</h2>
                    <p className="text-sm text-secondary-500">Crie, edite e delete categorias</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/categories/manage"
                  className="flex items-center justify-between w-full px-4 py-3 bg-success-50 hover:bg-success-100 border border-success-200 rounded-xl transition-colors group hover-lift"
                >
                  <span className="font-medium text-success-700">Abrir Gerenciador de Categorias</span>
                  <ArrowRight className="w-5 h-5 text-success-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/categories/insights"
                  className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group hover-lift"
                >
                  <span className="font-medium text-primary-700">Ver Análise de Categorias</span>
                  <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Gerenciamento de Usuários */}
            <div className="glass rounded-xl border border-secondary-200/50 shadow-card p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Gerenciar Usuários</h2>
                    <p className="text-sm text-secondary-500">Crie, edite e delete usuários</p>
                  </div>
                </div>
              </div>
              <Link
                href="/users/manage"
                className="flex items-center justify-between w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors group hover-lift"
              >
                <span className="font-medium text-primary-700">Abrir Gerenciador de Usuários</span>
                <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
