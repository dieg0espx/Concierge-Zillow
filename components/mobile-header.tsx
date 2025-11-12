'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'

export function MobileHeader({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="md:hidden border-b border-white/10 backdrop-blur-md bg-black/40 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="luxury-heading text-lg tracking-widest text-white">Admin Dashboard</h1>
          <p className="text-xs text-white/70 truncate">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="border-white/30 hover:bg-white/10 hover:border-white/50 text-white flex-shrink-0"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
