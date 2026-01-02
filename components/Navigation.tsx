'use client'

import { Home, Plus, Target, Settings, Repeat, BarChart3, PiggyBank, Calendar, Receipt, CreditCard, Bell, TrendingUp, Tag } from 'lucide-react'
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
    { icon: Repeat, label: 'Recorrentes', href: '/recurring' },
    { icon: CreditCard, label: 'Parcelamentos', href: '/installments' },
    { icon: Target, label: 'Planejamentos', href: '/plans' },
    { icon: PiggyBank, label: 'Metas', href: '/savings-goals' },
    { icon: BarChart3, label: 'Relatórios', href: '/reports' },
    { icon: Bell, label: 'Notificações', href: '/notifications' },
    { icon: Receipt, label: 'Comprovantes', href: '/receipts' },
    { icon: Calendar, label: 'Agendadas', href: '/scheduled' },
    { icon: TrendingUp, label: 'Tendências', href: '/trends' },
    { icon: Tag, label: 'Análise Categorias', href: '/categories/insights' },
  ]

  const isActive = (href: string) => {
    if (href === '#') return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Menu Expandido (Overlay) */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMore(false)}
          />
            <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-4 animate-slide-up">
              <div className="glass rounded-3xl shadow-elevated border border-secondary-200/50 p-4 sm:p-6 max-w-md mx-auto backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Mais Opções</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="text-secondary-500 hover:text-secondary-700 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 touch-manipulation hover-lift ${
                          active
                            ? 'bg-primary-50 text-primary-600 border-2 border-primary-300 shadow-md'
                            : 'text-secondary-600 hover:bg-primary-50/50 hover:text-primary-600 border-2 border-transparent'
                        }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

          {/* Menu Principal */}
          <nav className="fixed bottom-0 left-0 right-0 glass border-t border-secondary-200/50 z-50 shadow-elevated safe-area-bottom backdrop-blur-xl bg-white/80">
            <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
              <div className="flex items-center justify-around py-2 sm:py-3">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              if (item.isButton) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setShowMore(!showMore)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 sm:px-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
                      showMore
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} />
                    <span className={`text-[10px] sm:text-xs font-medium`}>
                      {item.label}
                    </span>
                  </button>
                )
              }

              return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex flex-col items-center gap-1 py-2 px-3 sm:px-4 rounded-2xl transition-all duration-200 touch-manipulation active:scale-95 ${
                        active
                          ? 'text-primary-600 bg-primary-50 shadow-md'
                          : 'text-secondary-500 hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                      <span className={`text-[10px] sm:text-xs font-semibold ${active ? 'text-primary-600' : ''}`}>
                        {item.label}
                      </span>
                    </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
