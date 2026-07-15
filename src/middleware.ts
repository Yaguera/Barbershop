import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const userRole = token?.role;

  const url = req.nextUrl;
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isBarberRoute = url.pathname.startsWith('/barber') || url.pathname.startsWith('/barbeiro');
  const isDashboardRoute = url.pathname.startsWith('/dashboard');
  const isProfileRoute = url.pathname.startsWith('/profile');

  // If not logged in and accessing protected routes, redirect to login
  if ((isAdminRoute || isBarberRoute || isDashboardRoute || isProfileRoute) && !isLoggedIn) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/barber/:path*',
    '/barbeiro/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
