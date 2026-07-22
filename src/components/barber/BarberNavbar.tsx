'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard
} from 'lucide-react';

interface BarberNavbarProps {
  barberProfileId?: string;
}

export function BarberNavbar({ barberProfileId }: BarberNavbarProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md text-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="José Carlos Barber Shop Logo" 
            width={40} 
            height={40} 
            className="w-10 h-10 rounded-full border border-carvalho/30 object-cover" 
          />
          <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            José Carlos Barber Shop
          </span>
        </Link>

        {/* Desktop Navigation (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-2 mr-2 pr-3 border-r border-zinc-800">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Barbeiro'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-dourado-premium/20 object-cover"
              />
            )}
            <span className="text-sm text-zinc-350">
              Barbeiro: <span className="text-white font-semibold">{session?.user?.name}</span>
            </span>
          </div>

          <Link
            href="/barber/agenda"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 hover:border-dourado-premium/30 transition-all motion-btn"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Agenda
          </Link>

          <Link
            href="/barber/metricas"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-dourado-premium border border-dourado-premium/40 shadow-[0_0_15px_rgba(245,197,66,0.15)] transition-all motion-btn"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Métricas
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 hover:border-dourado-premium/30 transition-all motion-btn"
          >
            <UserIcon className="w-3.5 h-3.5" />
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

      {/* Mobile Drawer via Portal */}
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
                  Menu do Barbeiro
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
                      alt={session.user.name || 'Barbeiro'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border border-carvalho/30 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-carvalho/20 flex items-center justify-center text-carvalho font-bold">
                      {session.user.name?.charAt(0) || 'B'}
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-zinc-400">Barbeiro</span>
                    <span className="text-sm font-bold text-white truncate">{session.user.name}</span>
                  </div>
                </div>
              )}

              {/* Navigation Links Stacked Vertically */}
              <nav className="flex flex-col gap-2.5">
                <Link
                  href="/barber/agenda"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-200 hover:bg-zinc-800 border border-zinc-800/80 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  Minha Agenda & Calendário
                </Link>

                <Link
                  href="/barber/metricas"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 transition-all"
                >
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Minhas Métricas
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80 transition-all"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Meu Perfil
                </Link>
              </nav>
            </div>

            {/* Drawer Footer with Sign Out */}
            <div className="pt-4 border-t border-zinc-900">
              <button
                onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-red-650/15 hover:bg-red-650/25 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
