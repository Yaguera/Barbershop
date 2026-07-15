'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Scissors 
} from 'lucide-react';

export function ClientNavbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md text-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {session?.user && (
            <div className="flex items-center gap-2">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Cliente'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-carvalho/20 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-carvalho/20 flex items-center justify-center text-carvalho font-bold text-xs">
                  {session.user.name?.charAt(0) || 'C'}
                </div>
              )}
              <span className="text-sm text-zinc-350">
                Cliente: <span className="text-white font-semibold">{session.user.name}</span>
              </span>
            </div>
          )}

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            Perfil
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/25 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 hover:bg-zinc-800 transition-colors md:hidden focus:outline-none"
          aria-label="Abrir menu do cliente"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-zinc-950 border-l border-zinc-800 z-50 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 md:hidden overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <span className="text-base font-bold text-amber-400">
                Menu de Navegação
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {session?.user && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Cliente'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border border-carvalho/30 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-carvalho/20 flex items-center justify-center text-carvalho font-bold">
                    {session.user.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-carvalho font-medium">Cliente VIP</span>
                  <span className="text-sm font-bold text-white truncate">{session.user.name}</span>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2.5">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 transition-all"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                Meus Agendamentos
              </Link>

              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80 transition-all"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                Novo Agendamento
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-zinc-900/60 text-slate-300 hover:bg-zinc-800 border border-zinc-800/80 transition-all"
              >
                <User className="w-4 h-4 text-slate-400" />
                Meu Perfil
              </Link>
            </nav>
          </div>

          <div className="pt-4 border-t border-zinc-900">
            <button
              onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
