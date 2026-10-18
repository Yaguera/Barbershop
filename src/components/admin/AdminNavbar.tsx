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
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const isTeamActive = activePage === 'barbeiros' || activePage === 'atendentes';
  const isSettingsActive = activePage === 'comissoes' || activePage === 'permissoes';

  const pillClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all motion-btn ${
      active
        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-dourado-premium border border-dourado-premium/50 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
        : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-dourado-premium/30'
    }`;

  const drawerLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active
        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
        : 'bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo / Brand */}
        <Link href="/admin/dashboard" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Barbearia Premium Logo"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full border border-amber-500/30 object-cover"
          />
          <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Barbearia Premium
          </span>
        </Link>

        {/* Desktop Navigation (hidden on mobile/tablet) */}
        <nav className="hidden xl:flex items-center gap-1.5" aria-label="Navegação administrativa">
          {session?.user && (
            <div className="flex items-center gap-2 mr-1 pr-2.5 border-r border-zinc-800">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Admin'}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full border border-dourado-premium/20 object-cover"
                />
              )}
              <span className="text-xs text-slate-400 max-w-[140px] truncate">
                <span className="text-slate-200 font-semibold">{session.user.name}</span>
              </span>
            </div>
          )}

          <Link href="/admin/dashboard" className={pillClass(activePage === 'dashboard')}>
            <LayoutDashboard className="w-3.5 h-3.5" />
            Painel
          </Link>

          <Link href="/admin/calendario" className={pillClass(activePage === 'calendario')}>
            <CalendarDays className="w-3.5 h-3.5" />
            Calendário
          </Link>

          <Link href="/admin/financeiro" className={pillClass(activePage === 'financeiro')}>
            <DollarSign className="w-3.5 h-3.5" />
            Financeiro
          </Link>

          <Link href="/admin/clientes" className={pillClass(activePage === 'clientes')}>
            <Users className="w-3.5 h-3.5" />
            Clientes
          </Link>

          <Link href="/admin/barbeiros" className={pillClass(isTeamActive)}>
            <Briefcase className="w-3.5 h-3.5" />
            Equipe
          </Link>

          <Link href="/admin/servicos" className={pillClass(activePage === 'servicos')}>
            <Scissors className="w-3.5 h-3.5" />
            Serviços
          </Link>

          <Link
            href="/admin/configuracoes/comissoes"
            className={pillClass(isSettingsActive)}
          >
            <Percent className="w-3.5 h-3.5" />
            Configurações
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 hover:border-dourado-premium/30 transition-all motion-btn"
          >
            <User className="w-3.5 h-3.5" />
            Perfil
          </Link>

          <button
            onClick={() =>
              signOut({
                callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/',
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-all motion-btn cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </nav>

        {/* Hamburger Menu Button (Mobile & Tablet) */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-dourado-premium hover:bg-zinc-800 transition-all motion-btn xl:hidden focus:outline-none cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer via Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] xl:hidden">
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
                  <span className="text-base font-bold text-amber-400">
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
                        className="w-10 h-10 rounded-full border border-amber-500/30 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
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
                    className={drawerLinkClass(activePage === 'dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    Painel Analítico
                  </Link>

                  <Link
                    href="/admin/calendario"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'calendario')}
                  >
                    <CalendarDays className="w-4 h-4 text-amber-400" />
                    Calendário e Caixa
                  </Link>

                  <Link
                    href="/admin/financeiro"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'financeiro')}
                  >
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    Financeiro
                  </Link>

                  <Link
                    href="/admin/clientes"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'clientes')}
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    Clientes
                  </Link>

                  <span className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Equipe e Catálogo
                  </span>
                  <Link
                    href="/admin/barbeiros"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'barbeiros')}
                  >
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    Equipe: Barbeiros
                  </Link>

                  <Link
                    href="/admin/atendentes"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'atendentes')}
                  >
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Equipe: Atendentes
                  </Link>

                  <Link
                    href="/admin/servicos"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'servicos')}
                  >
                    <Scissors className="w-4 h-4 text-amber-400" />
                    Serviços
                  </Link>

                  <span className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Configurações
                  </span>
                  <Link
                    href="/admin/configuracoes/comissoes"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'comissoes')}
                  >
                    <Percent className="w-4 h-4 text-amber-400" />
                    Política de Comissões
                  </Link>

                  <Link
                    href="/admin/configuracoes/permissoes"
                    onClick={() => setIsOpen(false)}
                    className={drawerLinkClass(activePage === 'permissoes')}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Permissões e Perfis
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
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
  );
}
