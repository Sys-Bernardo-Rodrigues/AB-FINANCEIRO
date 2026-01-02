import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import NotificationsList from '@/components/NotificationsList'
import AuthGuard from '@/components/AuthGuard'

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Notificações
          </h1>
          <NotificationsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
