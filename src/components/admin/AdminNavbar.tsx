'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CalendarDays, 
  Users, 
  Scissors, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard 
} from 'lucide-react';

interface AdminNavbarProps {
  activePage?: 'dashboard' | 'calendario' | 'clientes' | 'servicos';
}

export function AdminNavbar({ activePage }: AdminNavbarProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="José Carlos Barber Shop Logo" 
            width={40} 
            height={40} 
            className="w-10 h-10 rounded-full border border-amber-500/30 object-cover" 
          />
          <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            José Carlos Barber Shop
          </span>
        </Link>

        {/* Desktop Navigation (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2.5">
          {session?.user && (
            <div className="flex items-center gap-2 mr-2 pr-3 border-r border-zinc-800">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Admin'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-dourado-premium/20 object-cover"
                />
              )}
              <span className="text-sm text-slate-400">
                Admin: <span className="text-slate-200 font-semibold">{session.user.name}</span>
              </span>
            </div>
          )}

          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all motion-btn ${
              activePage === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-dourado-premium border border-dourado-premium/50 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-dourado-premium/30'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Painel
          </Link>

          <Link
            href="/admin/calendario"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all motion-btn ${
              activePage === 'calendario'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-dourado-premium border border-dourado-premium/50 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-dourado-premium/30'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendário
          </Link>

          <Link
            href="/admin/clientes"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all motion-btn ${
              activePage === 'clientes'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-dourado-premium border border-dourado-premium/50 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-dourado-premium/30'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clientes
          </Link>

          <Link
            href="/admin/servicos"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all motion-btn ${
              activePage === 'servicos'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-dourado-premium border border-dourado-premium/50 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border border-zinc-800 hover:border-dourado-premium/30'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Serviços
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 hover:border-dourado-premium/30 transition-all motion-btn"
          >
            <User className="w-3.5 h-3.5" />
            Perfil
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-all motion-btn cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-dourado-premium hover:bg-zinc-800 transition-all motion-btn md:hidden focus:outline-none cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer via Portal (breaks out of backdrop-blur containing block) */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 z-10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto text-white">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <span className="text-base font-bold text-amber-400">
                  Menu de Navegação
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
                    <span className="text-sm font-bold text-white truncate">{session.user.name}</span>
                  </div>
                </div>
              )}

              {/* Navigation Links Stacked Vertically */}
              <nav className="flex flex-col gap-2.5">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activePage === 'dashboard'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  Painel Administrativo
                </Link>

                <Link
                  href="/admin/calendario"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activePage === 'calendario'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  Calendário Hierárquico
                </Link>

                <Link
                  href="/admin/clientes"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activePage === 'clientes'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  Gestão de Clientes
                </Link>

                <Link
                  href="/admin/servicos"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activePage === 'servicos'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  <Scissors className="w-4 h-4 text-amber-400" />
                  Gestão de Serviços
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80 transition-all"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Meu Perfil
                </Link>
              </nav>
            </div>

            {/* Drawer Footer with Sign Out */}
            <div className="pt-4 border-t border-zinc-900">
              <button
                onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
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
