import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import SavingsGoalsList from '@/components/SavingsGoalsList'
import AuthGuard from '@/components/AuthGuard'

export default function SavingsGoalsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Metas de Economia
          </h1>
          <SavingsGoalsList />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}
