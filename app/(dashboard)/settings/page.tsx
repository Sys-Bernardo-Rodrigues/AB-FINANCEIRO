'use client'

import { Card } from '@/components/ui/Card'
import { useAuth } from '@/lib/hooks/useAuth'
import { Settings as SettingsIcon, User, Bell } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
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

      {/* Sobre */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sobre</h2>
            <p className="text-sm text-slate-600">Informações do sistema</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">AB Financeiro</strong> - Sistema
            de controle financeiro pessoal
          </p>
          <p>Versão 1.0.0</p>
          <p className="pt-4 border-t border-slate-200">
            © 2026 AB Financeiro. Todos os direitos reservados.
          </p>
        </div>
      </Card>
    </div>
  )
}

