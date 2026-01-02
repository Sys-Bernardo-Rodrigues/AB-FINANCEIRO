'use client'

import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import CategoryDetailInsights from '@/components/CategoryDetailInsights'
import AuthGuard from '@/components/AuthGuard'
import { useParams } from 'next/navigation'

export default function CategoryDetailInsightsPage() {
  const params = useParams()
  const categoryId = params.id as string

  return (
    <AuthGuard>
      <div className="min-h-screen bg-secondary-50 pb-20 sm:pb-24">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <CategoryDetailInsights categoryId={categoryId} />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

