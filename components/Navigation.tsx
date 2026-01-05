'use client'

import { useState } from 'react'
import { 
  Home, 
  Plus, 
  Settings, 
  MoreVertical,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Repeat,
  CreditCard,
  Wallet,
  Clock,
  Receipt,
  Target,
  Bell,
  Flag,
  Tag,
  Users,
  List,
  UsersRound
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Itens principais da navegação
  const mainNavItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: FileText, label: 'Transações', href: '/transactions' },
    { icon: Plus, label: 'Adicionar', href: '/add' },
    { icon: Calendar, label: 'Calendário', href: '/calendar' },
  ]

  // Itens do menu "Mais"
  const moreNavItems = [
    { icon: Target, label: 'Planejamentos', href: '/plans' },
    { icon: BarChart3, label: 'Relatórios', href: '/reports' },
    { icon: TrendingUp, label: 'Tendências', href: '/trends' },
    { icon: Repeat, label: 'Recorrentes', href: '/recurring' },
    { icon: CreditCard, label: 'Parcelas', href: '/installments' },
    { icon: Wallet, label: 'Cartões de Crédito', href: '/credit-cards' },
    { icon: Clock, label: 'Agendadas', href: '/scheduled' },
    { icon: Receipt, label: 'Comprovantes', href: '/receipts' },
    { icon: Flag, label: 'Metas', href: '/savings-goals' },
    { icon: Bell, label: 'Notificações', href: '/notifications' },
    { icon: UsersRound, label: 'Grupos de Família', href: '/family-groups' },
    { icon: List, label: 'Gerenciar Transações', href: '/transactions/manage' },
    { icon: Tag, label: 'Gerenciar Categorias', href: '/categories/manage' },
    { icon: Users, label: 'Gerenciar Usuários', href: '/users/manage' },
    { icon: Settings, label: 'Config', href: '/settings' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleMoreItemClick = (href: string) => {
    setShowMoreMenu(false)
    router.push(href)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-secondary-100 z-50 safe-area-bottom">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-around py-3">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all touch-manipulation active:scale-90 ${
                    active
                      ? 'text-primary-600'
                      : 'text-secondary-400'
                  }`}
                >
                  <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                    <Icon className={`w-6 h-6 ${active ? 'text-primary-600' : ''}`} />
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold ${active ? 'text-primary-600' : 'text-secondary-400'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            {/* Botão "Mais" */}
            <button
              onClick={() => setShowMoreMenu(true)}
              className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all touch-manipulation active:scale-90 ${
                moreNavItems.some(item => isActive(item.href))
                  ? 'text-primary-600'
                  : 'text-secondary-400'
              }`}
              aria-label="Mais opções"
            >
              <div className={`relative ${moreNavItems.some(item => isActive(item.href)) ? 'scale-110' : ''} transition-transform`}>
                <MoreVertical className="w-6 h-6" />
                {moreNavItems.some(item => isActive(item.href)) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                )}
              </div>
              <span className={`text-[11px] font-semibold ${moreNavItems.some(item => isActive(item.href)) ? 'text-primary-600' : 'text-secondary-400'}`}>
                Mais
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modal do menu "Mais" */}
      <Modal
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="Mais Opções"
        size="md"
        closeOnOverlayClick={true}
      >
        <div className="grid grid-cols-2 gap-3">
          {moreNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => handleMoreItemClick(item.href)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
                  active
                    ? 'bg-primary-50 text-primary-600 border-2 border-primary-200'
                    : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border-2 border-transparent hover:border-secondary-200'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </Modal>
    </>
  )
}
