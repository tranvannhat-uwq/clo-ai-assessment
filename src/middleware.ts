import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value
  const role = request.cookies.get('user-role')?.value
  
  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'
  
  // Public static bypass
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.endsWith('.ico')) {
    return NextResponse.next()
  }

  // Redirect to login if unauthenticated
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Role based access control and Redirects
  if (token && role && isLoginPage) {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'LECTURER') return NextResponse.redirect(new URL('/lecturer', request.url))
    return NextResponse.redirect(new URL('/student', request.url))
  }
  
  // Protect routes based on role
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/lecturer') && role !== 'LECTURER') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Homepage logic -> Route into dashboard
  if (pathname === '/') {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'LECTURER') return NextResponse.redirect(new URL('/lecturer', request.url))
    if (role === 'STUDENT') return NextResponse.redirect(new URL('/student', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
