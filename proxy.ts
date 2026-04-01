import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

const protectedLearnerRoutes = [
  '/dashboard',
  '/courses',
  '/payment',
  '/learning',
  '/assessment',
  '/result',
  '/certificate',
]

const protectedAdminRoutes = ['/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLearnerRoute = protectedLearnerRoutes.some((r) => pathname.startsWith(r))
  const isAdminRoute = protectedAdminRoutes.some((r) => pathname.startsWith(r))

  if (isLearnerRoute || isAdminRoute) {
    const user = getCurrentUser(request)

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAdminRoute && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isLearnerRoute && user.role !== 'LEARNER') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    const user = getCurrentUser(request)
    if (user) {
      if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/:path*',
    '/payment/:path*',
    '/learning/:path*',
    '/assessment/:path*',
    '/result/:path*',
    '/certificate/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
