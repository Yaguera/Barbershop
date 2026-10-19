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

  const navItemClass = (active: boolean) =>
    `group relative inline-flex h-16 items-center gap-2 px-3.5 text-xs font-medium tracking-wide transition-colors ${
      active
        ? 'text-white bg-white/[0.03] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#D4AF37]'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.02]'
    }`;

  const navIconClass = (active: boolean) =>
    `w-3.5 h-3.5 transition-colors ${
      active ? 'text-[#D4AF37]' : 'text-zinc-500 group-hover:text-zinc-300'
    }`;

  const drawerLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]'
        : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0B0B]/95 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Identity */}
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
              <span className="text-sm sm:text-base font-semibold tracking-tight text-white group-hover:text-[#D4AF37] transition-colors">
                Barbearia Premium
              </span>
              <span className="hidden sm:inline-block rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation (flat architectural tabs, no pill capsules) */}
        <nav className="hidden xl:flex items-center h-full" aria-label="Navegação administrativa">
          <Link href="/admin/dashboard" className={navItemClass(activePage === 'dashboard')}>
            <LayoutDashboard className={navIconClass(activePage === 'dashboard')} />
            <span>Painel</span>
          </Link>

          <Link href="/admin/calendario" className={navItemClass(activePage === 'calendario')}>
            <CalendarDays className={navIconClass(activePage === 'calendario')} />
            <span>Calendário & Caixa</span>
          </Link>

          <Link href="/admin/financeiro" className={navItemClass(activePage === 'financeiro')}>
            <DollarSign className={navIconClass(activePage === 'financeiro')} />
            <span>Financeiro</span>
          </Link>

          <Link href="/admin/clientes" className={navItemClass(activePage === 'clientes')}>
            <Users className={navIconClass(activePage === 'clientes')} />
            <span>Clientes</span>
          </Link>

          <Link href="/admin/barbeiros" className={navItemClass(isTeamActive)}>
            <Briefcase className={navIconClass(isTeamActive)} />
            <span>Equipe</span>
          </Link>

          <Link href="/admin/servicos" className={navItemClass(activePage === 'servicos')}>
            <Scissors className={navIconClass(activePage === 'servicos')} />
            <span>Serviços</span>
          </Link>

          <Link
            href="/admin/configuracoes/comissoes"
            className={navItemClass(isSettingsActive)}
          >
            <Percent className={navIconClass(isSettingsActive)} />
            <span>Configurações</span>
          </Link>
        </nav>

        {/* Right: User Account & Session Actions */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Acessar meu perfil"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Admin'}
                width={24}
                height={24}
                className="w-6 h-6 rounded-md border border-white/10 object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-300">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="max-w-[140px] truncate text-zinc-200 font-medium">
              {session?.user?.name || 'Perfil'}
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10 mx-0.5" aria-hidden="true" />

          <button
            onClick={() =>
              signOut({
                callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/',
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        {/* Hamburger Menu Button (Mobile & Tablet) */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md bg-white/[0.04] border border-white/10 text-zinc-200 hover:text-[#D4AF37] hover:bg-white/[0.08] transition-colors xl:hidden focus:outline-none cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
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
