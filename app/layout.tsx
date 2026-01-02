import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import PWARegister from '@/components/PWARegister'
import OfflineIndicator from '@/components/OfflineIndicator'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import IOSMetaTags from '@/components/IOSMetaTags'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AB Financeiro',
  description: 'Sistema de controle financeiro pessoal',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AB Financeiro',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <IOSMetaTags />
        <AuthProvider>
          {children}
          <PWARegister />
          <OfflineIndicator />
          <PWAInstallPrompt />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
