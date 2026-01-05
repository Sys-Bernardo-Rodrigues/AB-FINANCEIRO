import Header from '@/components/Header'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import FamilyGroupManagement from '@/components/FamilyGroupManagement'

export default function FamilyGroupsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-24 safe-area-bottom bg-[#f5f5f5]">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <FamilyGroupManagement />
        </main>
        <Navigation />
      </div>
    </AuthGuard>
  )
}

