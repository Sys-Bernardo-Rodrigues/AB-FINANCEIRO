'use client'

import { Home, Plus, Target, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Target, label: 'Planejamentos', href: '/plans' },
    { icon: Plus, label: 'Adicionar', href: '/add' },
    { icon: Settings, label: 'Config', href: '/settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 z-50 shadow-lg safe-area-bottom">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-3 sm:px-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-primary-600' : ''}`} />
                <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-primary-600' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
