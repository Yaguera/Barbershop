import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const authProxy = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role;

  const url = req.nextUrl;
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isBarberRoute = url.pathname.startsWith('/barber') || url.pathname.startsWith('/barbeiro');
  const isReceptionistRoute = url.pathname.startsWith('/atendente');
  const isDashboardRoute = url.pathname.startsWith('/dashboard');
  const isProfileRoute = url.pathname.startsWith('/profile');

  // If not logged in and accessing protected routes, redirect to login
  if ((isAdminRoute || isBarberRoute || isReceptionistRoute || isDashboardRoute || isProfileRoute) && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', req.url);
    // Remember the callbackUrl for redirect after login
    loginUrl.searchParams.set('callbackUrl', url.pathname);
    return NextResponse.redirect(loginUrl);
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
    '/admin/:path*',
    '/barber/:path*',
    '/barbeiro/:path*',
    '/atendente/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
