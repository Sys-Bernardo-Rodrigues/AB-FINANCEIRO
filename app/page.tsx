import Dashboard from '@/components/Dashboard'
import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 safe-area-bottom">
        <Header />
        <main className="container mx-auto px-4 py-4 max-w-7xl">
          <Dashboard />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
