import { auth } from '@/auth';
import { createForbiddenResponse, createUnauthorizedResponse } from '@/core/presentation/http-error-pages';
import { NextResponse } from 'next/server';

const authProxy = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role;

  const pathname = req.nextUrl.pathname;

  // Segmentos completos de rota para evitar conflitos de prefixo
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isBarberRoute = pathname === '/barber' || pathname.startsWith('/barber/');
  const isBarbeiroAlias = pathname === '/barbeiro' || pathname.startsWith('/barbeiro/');
  const isReceptionistRoute = pathname === '/atendente' || pathname.startsWith('/atendente/');
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isProfileRoute = pathname === '/profile' || pathname.startsWith('/profile/');
  const isClientAreaRoute =
    pathname === '/agenda' ||
    pathname.startsWith('/agenda/') ||
    pathname === '/historico' ||
    pathname.startsWith('/historico/');

  // 1. Encaminhamentos legítimos da Home pública (/)
  if (pathname === '/') {
    if (isLoggedIn) {
      if (userRole === 'BARBER') {
        return NextResponse.redirect(new URL('/barber/dashboard', req.nextUrl));
      }
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
      }
      if (userRole === 'RECEPTIONIST') {
        return NextResponse.redirect(new URL('/atendente', req.nextUrl));
      }
    }
    return NextResponse.next();
  }

  // 2. Encaminhamento legítimo do /dashboard (dispatcher interno por perfil)
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
    if (userRole === 'BARBER') {
      return NextResponse.redirect(new URL('/barber/dashboard', req.nextUrl));
    }
    if (userRole === 'RECEPTIONIST') {
      return NextResponse.redirect(new URL('/atendente', req.nextUrl));
    }
    // Clientes vão para sua agenda
    return NextResponse.redirect(new URL('/agenda', req.nextUrl));
  }

  // 3. Alias legado /barbeiro/agenda -> /barber/agenda (autorizar antes do alias)
  if (isBarbeiroAlias) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole !== 'BARBER' && userRole !== 'ADMIN') {
      return createForbiddenResponse(req, pathname, userRole);
    }
    const targetPath = pathname.replace(/^\/barbeiro/, '/barber');
    return NextResponse.redirect(new URL(targetPath, req.nextUrl));
  }

  // 4. Rotas Administrativas (/admin/*) -> Apenas ADMIN
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole !== 'ADMIN') {
      return createForbiddenResponse(req, pathname, userRole);
    }
    return NextResponse.next();
  }

  // 5. Rotas do Barbeiro (/barber/*) -> BARBER ou ADMIN
  if (isBarberRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole !== 'BARBER' && userRole !== 'ADMIN') {
      return createForbiddenResponse(req, pathname, userRole);
    }
    return NextResponse.next();
  }

  // 6. Rotas da Atendente e Caixa (/atendente/*) -> RECEPTIONIST ou ADMIN
  if (isReceptionistRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole !== 'RECEPTIONIST' && userRole !== 'ADMIN') {
      return createForbiddenResponse(req, pathname, userRole);
    }
    return NextResponse.next();
  }

  // 7. Área do Cliente (/agenda, /historico) -> Apenas CLIENT
  if (isClientAreaRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    if (userRole !== 'CLIENT') {
      return createForbiddenResponse(req, pathname, userRole);
    }
    return NextResponse.next();
  }

  // 8. Conta e Perfil (/profile) -> Qualquer perfil autenticado
  if (isProfileRoute) {
    if (!isLoggedIn) {
      return createUnauthorizedResponse(req, pathname);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const proxy = authProxy;
export default authProxy;

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/agenda/:path*',
    '/historico/:path*',
    '/admin/:path*',
    '/barber/:path*',
    '/barbeiro/:path*',
    '/atendente/:path*',
    '/profile/:path*',
  ],
};
