import Dashboard from '@/components/Dashboard'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-secondary-50 pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Dashboard />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
