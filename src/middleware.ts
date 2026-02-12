import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Solo permitir acceso si hay token (usuario autenticado)
        if (req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true // Siempre permitir acceso a auth endpoints
        }
        
        if (req.nextUrl.pathname.startsWith('/auth/login')) {
          return true // Siempre permitir acceso a la página de login
        }
        
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}