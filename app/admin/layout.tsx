import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { MobileHeader } from '@/components/mobile-header'
import { Toaster } from '@/components/ui/toaster'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen marble-bg flex flex-col md:flex-row">
      {/* Mobile header */}
      <MobileHeader user={user} />

      <AdminSidebar user={user} />
      <main className="flex-1 py-6 md:py-10 px-4 md:px-8 animate-fade-in overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
