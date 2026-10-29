'use client';

import {
  Briefcase,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Scissors,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export type AdminActivePage =
  | 'dashboard'
  | 'calendario'
  | 'financeiro'
  | 'clientes'
  | 'barbeiros'
  | 'atendentes'
  | 'servicos'
  | 'comissoes'
  | 'permissoes';

interface AdminNavbarProps {
  activePage?: AdminActivePage;
}

const subscribe = () => () => {};

export function AdminNavbar({ activePage }: AdminNavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const resolvedPage: AdminActivePage | undefined =
    activePage ??
    (pathname?.startsWith('/admin/financeiro')
      ? 'financeiro'
      : pathname?.startsWith('/admin/calendario')
        ? 'calendario'
        : pathname?.startsWith('/admin/clientes')
          ? 'clientes'
          : pathname?.startsWith('/admin/atendentes')
            ? 'atendentes'
            : pathname?.startsWith('/admin/barbeiros')
              ? 'barbeiros'
              : pathname?.startsWith('/admin/servicos')
                ? 'servicos'
                : pathname?.startsWith('/admin/configuracoes/permissoes')
                  ? 'permissoes'
                  : pathname?.startsWith('/admin/configuracoes')
                    ? 'comissoes'
                    : pathname?.startsWith('/admin/dashboard')
                      ? 'dashboard'
                      : undefined);

  const isProfileActive = pathname?.startsWith('/profile') ?? false;

  const sidebarLinkClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
      active
        ? 'bg-white/[0.08] text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-[#C5A059]'
        : 'text-zinc-400 font-medium hover:bg-white/[0.04] hover:text-zinc-200'
    }`;

  const sidebarIconClass = (active: boolean) =>
    `w-4 h-4 shrink-0 transition-colors ${
      active ? 'text-[#C5A059]' : 'text-zinc-500 group-hover:text-zinc-300'
    }`;

  const drawerLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-[#C5A059]/10 text-[#C5A059] border-l-2 border-[#C5A059]'
        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
    }`;

  const userName = session?.user?.name || 'Administrador';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#C5A059] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-zinc-950 focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      {/* Desktop Left Sidebar (≥ 1024px) */}
      <aside
        aria-label="Navegação lateral administrativa"
        className="hidden lg:flex lg:w-60 xl:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:px-3.5 lg:py-5 select-none z-40"
      >
        <div className="space-y-5">
          {/* Top Identity / User Header */}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 min-w-0 group"
            >
              <div className="relative shrink-0">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200">
                    {userInitial}
                  </div>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#141416]"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-zinc-100 truncate leading-tight group-hover:text-white transition-colors">
                  {userName}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                  Administrador
                </span>
              </div>
            </Link>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1" aria-label="Menu principal do administrador">
            <Link
              href="/admin/dashboard"
              aria-current={resolvedPage === 'dashboard' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'dashboard')}
            >
              <LayoutDashboard className={sidebarIconClass(resolvedPage === 'dashboard')} />
              <span>Visão geral</span>
            </Link>

            <Link
              href="/admin/calendario"
              aria-current={resolvedPage === 'calendario' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'calendario')}
            >
              <CalendarDays className={sidebarIconClass(resolvedPage === 'calendario')} />
              <span>Calendário</span>
            </Link>

            <Link
              href="/admin/financeiro"
              aria-current={resolvedPage === 'financeiro' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'financeiro')}
            >
              <DollarSign className={sidebarIconClass(resolvedPage === 'financeiro')} />
              <span>Financeiro</span>
            </Link>

            <Link
              href="/admin/clientes"
              aria-current={resolvedPage === 'clientes' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'clientes')}
            >
              <Users className={sidebarIconClass(resolvedPage === 'clientes')} />
              <span>Clientes</span>
            </Link>

            <div className="my-3 h-px bg-white/[0.06]" role="separator" />

            <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Equipe & Sistema
            </div>

            <Link
              href="/admin/barbeiros"
              aria-current={resolvedPage === 'barbeiros' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'barbeiros')}
            >
              <Briefcase className={sidebarIconClass(resolvedPage === 'barbeiros')} />
              <span>Equipe: Barbeiros</span>
            </Link>

            <Link
              href="/admin/atendentes"
              aria-current={resolvedPage === 'atendentes' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'atendentes')}
            >
              <UserCheck className={sidebarIconClass(resolvedPage === 'atendentes')} />
              <span>Equipe: Atendentes</span>
            </Link>

            <Link
              href="/admin/servicos"
              aria-current={resolvedPage === 'servicos' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'servicos')}
            >
              <Scissors className={sidebarIconClass(resolvedPage === 'servicos')} />
              <span>Serviços</span>
            </Link>

            <Link
              href="/admin/configuracoes/comissoes"
              aria-current={resolvedPage === 'comissoes' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'comissoes')}
            >
              <Percent className={sidebarIconClass(resolvedPage === 'comissoes')} />
              <span>Comissões</span>
            </Link>

            <Link
              href="/admin/configuracoes/permissoes"
              aria-current={resolvedPage === 'permissoes' ? 'page' : undefined}
              className={sidebarLinkClass(resolvedPage === 'permissoes')}
            >
              <ShieldCheck className={sidebarIconClass(resolvedPage === 'permissoes')} />
              <span>Permissões</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Footer Actions */}
        <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-1">
          <Link
            href="/profile"
            aria-current={isProfileActive ? 'page' : undefined}
            className={sidebarLinkClass(isProfileActive)}
          >
            <User className={sidebarIconClass(isProfileActive)} />
            <span>Minha Conta</span>
          </Link>

          <button
            type="button"
            onClick={() =>
              signOut({
                callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/',
              })
            }
            className="w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile & Tablet Top Header (< 1024px) */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0B0B]/95 backdrop-blur-md lg:hidden">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-3 shrink-0 group">
              <Image
                src="/logo.png"
                alt="Barbearia Premium Logo"
                width={34}
                height={34}
                className="w-8.5 h-8.5 rounded-md border border-white/10 object-cover"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-white group-hover:text-[#C5A059] transition-colors">
                  Barbearia Premium
                </span>
                <span className="hidden sm:inline-block rounded bg-[#C5A059]/10 border border-[#C5A059]/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C5A059]">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md bg-white/[0.04] border border-white/10 text-zinc-200 hover:text-[#C5A059] hover:bg-white/[0.08] transition-colors focus:outline-none cursor-pointer"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Drawer via Portal */}
        {mounted &&
          isOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9999] lg:hidden">
              {/* Backdrop Overlay */}
              <div
                className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
              />

              {/* Drawer Sidebar */}
              <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 z-10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto text-white">
                <div className="space-y-5">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <span className="text-base font-bold text-[#C5A059]">
                      Gestão Administrativa
                    </span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="Fechar menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Profile Summary in Drawer */}
                  {session?.user && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'Admin'}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full border border-[#C5A059]/30 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] font-bold">
                          {session.user.name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs text-slate-400">Administrador</span>
                        <span className="text-sm font-bold text-white truncate">
                          {session.user.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links Stacked Vertically */}
                  <nav className="flex flex-col gap-2" aria-label="Menu administrativo">
                    <span className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Análise e Operação
                    </span>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'dashboard' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#C5A059]" />
                      Painel Analítico
                    </Link>

                    <Link
                      href="/admin/calendario"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'calendario' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'calendario')}
                    >
                      <CalendarDays className="w-4 h-4 text-[#C5A059]" />
                      Calendário e Caixa
                    </Link>

                    <Link
                      href="/admin/financeiro"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'financeiro' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'financeiro')}
                    >
                      <DollarSign className="w-4 h-4 text-[#C5A059]" />
                      Financeiro
                    </Link>

                    <Link
                      href="/admin/clientes"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'clientes' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'clientes')}
                    >
                      <Users className="w-4 h-4 text-[#C5A059]" />
                      Clientes
                    </Link>

                    <span className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Equipe e Catálogo
                    </span>
                    <Link
                      href="/admin/barbeiros"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'barbeiros' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'barbeiros')}
                    >
                      <Briefcase className="w-4 h-4 text-[#C5A059]" />
                      Equipe: Barbeiros
                    </Link>

                    <Link
                      href="/admin/atendentes"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'atendentes' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'atendentes')}
                    >
                      <UserCheck className="w-4 h-4 text-[#C5A059]" />
                      Equipe: Atendentes
                    </Link>

                    <Link
                      href="/admin/servicos"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'servicos' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'servicos')}
                    >
                      <Scissors className="w-4 h-4 text-[#C5A059]" />
                      Serviços
                    </Link>

                    <span className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Configurações
                    </span>
                    <Link
                      href="/admin/configuracoes/comissoes"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'comissoes' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'comissoes')}
                    >
                      <Percent className="w-4 h-4 text-[#C5A059]" />
                      Política de Comissões
                    </Link>

                    <Link
                      href="/admin/configuracoes/permissoes"
                      onClick={() => setIsOpen(false)}
                      aria-current={resolvedPage === 'permissoes' ? 'page' : undefined}
                      className={drawerLinkClass(resolvedPage === 'permissoes')}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                      Permissões e Perfis
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      aria-current={isProfileActive ? 'page' : undefined}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80 transition-all mt-1"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Meu Perfil
                    </Link>
                  </nav>
                </div>

                {/* Drawer Footer with Sign Out */}
                <div className="pt-4 border-t border-zinc-900 mt-4">
                  <button
                    onClick={() =>
                      signOut({
                        callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/',
                      })
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </header>
    </>
  );
}
