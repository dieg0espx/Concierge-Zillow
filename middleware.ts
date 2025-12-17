import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Only run middleware on admin routes that need authentication.
     * This prevents auth timeouts on public pages.
     */
    '/admin/:path*',
  ],
}
