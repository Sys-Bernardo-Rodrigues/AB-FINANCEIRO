import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Rotas de API de autenticação são sempre públicas
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Se está em rota pública e tem token, redireciona para home
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Se não está em rota pública e não tem token, redireciona para login
  if (!isPublicRoute && !token && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

