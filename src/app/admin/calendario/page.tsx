'use client';

import { AdminCalendarView } from '@/components/admin/AdminCalendarView';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Scissors, Users } from 'lucide-react';

export default function AdminCalendarioPage() {
  return (
    <div className="min-h-screen bg-preto-classico text-off-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/servicos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              Serviços
            </Link>
            <Link
              href="/admin/clientes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Clientes
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              <span className="text-base font-bold text-white hidden sm:inline">Calendário Hierárquico</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <AdminCalendarView />
      </main>
    </div>
  );
}
