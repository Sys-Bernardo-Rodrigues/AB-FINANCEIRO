'use client'

import { Home, Plus, Target, Settings, Repeat, BarChart3, PiggyBank, Calendar, Receipt, CreditCard, Bell, TrendingUp, Tag, Users, X, Layers } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const mainNavItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Receipt, label: 'Transações', href: '/transactions' },
    { icon: Plus, label: 'Adicionar', href: '/add' },
    { icon: Calendar, label: 'Calendário', href: '/calendar' },
    { icon: Settings, label: 'Mais', href: '#', isButton: true },
  ]

  const moreNavItems = [
    { icon: Users, label: 'Usuários', href: '/users/manage' },
    { icon: Repeat, label: 'Recorrentes', href: '/recurring' },
    { icon: CreditCard, label: 'Parcelamentos', href: '/installments' },
    { icon: Target, label: 'Planejamentos', href: '/plans' },
    { icon: PiggyBank, label: 'Metas', href: '/savings-goals' },
    { icon: BarChart3, label: 'Relatórios', href: '/reports' },
    { icon: Bell, label: 'Notificações', href: '/notifications' },
    { icon: Receipt, label: 'Comprovantes', href: '/receipts' },
    { icon: Calendar, label: 'Agendadas', href: '/scheduled' },
    { icon: TrendingUp, label: 'Tendências', href: '/trends' },
    { icon: Layers, label: 'Gerenciar Categorias', href: '/categories/manage' },
    { icon: Tag, label: 'Análise Categorias', href: '/categories/insights' },
  ]

  const isActive = (href: string) => {
    if (href === '#') return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Menu Expandido (Overlay) - Mobile First */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-4 animate-slide-up safe-area-bottom">
            <div className="glass-card rounded-3xl shadow-mobile-lg border border-white/50 p-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-900">Mais Opções</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-xl transition-all touch-feedback"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 touch-feedback ${
                        active
                          ? 'bg-primary-50 text-primary-600 border-2 border-primary-200 shadow-md'
                          : 'text-secondary-600 hover:bg-secondary-50 border-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Menu Principal - Mobile First Design */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/50 z-50 shadow-mobile-lg safe-area-bottom bg-white/95 backdrop-blur-xl">
        <div className="container mx-auto px-2 max-w-7xl">
          <div className="flex items-center justify-around py-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              if (item.isButton) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setShowMore(!showMore)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all touch-feedback ${
                      showMore
                        ? 'text-primary-600 bg-primary-50 scale-105'
                        : 'text-secondary-500 hover:text-primary-600'
                    }`}
                    aria-label="Mais opções"
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 touch-feedback relative ${
                    active
                      ? 'text-primary-600 bg-primary-50 scale-105'
                      : 'text-secondary-500 hover:text-primary-600'
                  }`}
                >
                  <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                  <span className={`text-[10px] font-semibold ${active ? 'text-primary-600' : ''}`}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
