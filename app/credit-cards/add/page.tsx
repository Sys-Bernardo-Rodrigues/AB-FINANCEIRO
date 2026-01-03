import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import CreditCardForm from '@/components/CreditCardForm'
import AuthGuard from '@/components/AuthGuard'
import Card from '@/components/ui/Card'

export default function AddCreditCardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-6">
            Adicionar Cartão de Crédito
          </h1>
          <Card className="max-w-2xl mx-auto">
            <CreditCardForm />
          </Card>
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

