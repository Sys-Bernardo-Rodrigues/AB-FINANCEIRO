import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import PlansList from '@/components/PlansList'
import AuthGuard from '@/components/AuthGuard'

export default function PlansPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Planejamentos
          </h1>
          <PlansList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
