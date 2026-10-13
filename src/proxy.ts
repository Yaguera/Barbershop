import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const authProxy = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role;

  const url = req.nextUrl;
  const pathname = url.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isBarberRoute = pathname.startsWith('/barber') || pathname.startsWith('/barbeiro');
  const isReceptionistRoute = pathname.startsWith('/atendente');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProfileRoute = pathname.startsWith('/profile');
  const isClientOnlyRoute =
    pathname === '/' ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/historico');

  // If not logged in and accessing protected routes, redirect to login
  if (
    (isAdminRoute ||
      isBarberRoute ||
      isReceptionistRoute ||
      isDashboardRoute ||
      isProfileRoute ||
      pathname.startsWith('/agenda') ||
      pathname.startsWith('/historico')) &&
    !isLoggedIn
  ) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Atendente autenticada: isolamento estrito no painel da atendente (/atendente).
  // Sempre que tentar acessar telas de cliente, admin, barbeiro ou dashboard geral,
  // é redirecionada imediatamente para seu painel próprio.
  if (isLoggedIn && userRole === 'RECEPTIONIST') {
    if (isClientOnlyRoute || isDashboardRoute || isAdminRoute || isBarberRoute) {
      return NextResponse.redirect(new URL('/atendente', req.url));
    }
  }

  // Barbeiro autenticado: se tentar acessar home pública de agendamento de cliente
  if (isLoggedIn && userRole === 'BARBER' && pathname === '/') {
    return NextResponse.redirect(new URL('/barber/dashboard', req.url));
  }

  // Admin autenticado: se tentar acessar home pública de agendamento de cliente
  if (isLoggedIn && userRole === 'ADMIN' && pathname === '/') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // Admin route requires ADMIN role
  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Barber route requires BARBER or ADMIN role
  if (isBarberRoute && userRole !== 'BARBER' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Receptionist route requires RECEPTIONIST or ADMIN role
  if (isReceptionistRoute && userRole !== 'RECEPTIONIST' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const proxy = authProxy;
export default authProxy;

export const config = {
  matcher: [
    '/',
    '/agenda/:path*',
    '/historico/:path*',
    '/admin/:path*',
    '/barber/:path*',
    '/barbeiro/:path*',
    '/atendente/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
