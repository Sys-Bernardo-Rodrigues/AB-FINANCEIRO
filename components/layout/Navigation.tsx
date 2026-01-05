'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  TrendingUp,
  CreditCard,
  Target,
  Users,
  Settings,
  Calendar,
  PieChart,
  RefreshCw,
  FileText,
  Clock,
  Receipt,
  ListChecks,
  Menu,
  X,
  Tag,
  UserCog,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transações', href: '/transactions', icon: TrendingUp },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Categorias', href: '/categories', icon: Tag },
  { name: 'Cartões', href: '/credit-cards', icon: CreditCard },
  { name: 'Metas', href: '/savings-goals', icon: Target },
  { name: 'Planejamentos', href: '/plans', icon: ListChecks },
  { name: 'Recorrentes', href: '/recurring-transactions', icon: RefreshCw },
  { name: 'Parcelamentos', href: '/installments', icon: Receipt },
  { name: 'Agendadas', href: '/scheduled', icon: Clock },
  { name: 'Comprovantes', href: '/receipts', icon: FileText },
  { name: 'Usuários', href: '/users', icon: UserCog },
  { name: 'Família', href: '/family-groups', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: PieChart },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const mainNavigation = navigation.slice(0, 3) // Primeiras 3 páginas principais (total de 4 itens com o botão Mais)

  const handleLinkClick = (href: string) => {
    setMenuOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Menu Drawer */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header do Drawer */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* Conteúdo do Menu */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleLinkClick(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                          isActive
                            ? 'bg-gradient-primary text-white shadow-glow'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-40 lg:hidden safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {mainNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
            {/* Botão Menu Hambúrguer */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                menuOpen
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:border-r lg:border-slate-200 lg:flex lg:flex-col">
      <div className="flex-1 flex flex-col pt-20 pb-4 overflow-y-auto scrollbar-thin">
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

