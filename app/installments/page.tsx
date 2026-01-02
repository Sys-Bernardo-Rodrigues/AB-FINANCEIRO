import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import InstallmentsList from '@/components/InstallmentsList'
import AuthGuard from '@/components/AuthGuard'

export default function InstallmentsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-secondary-50 pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Parcelamentos
          </h1>
          <InstallmentsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
