'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getClientManagementAction } from '@/app/actions/admin-actions';
import { Users, Search, DollarSign, Calendar, Mail, Phone, ArrowLeft, RefreshCw, AlertCircle, LogOut, User, Award, Scissors, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ClientSummaryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string | Date;
  totalAppointments: number;
  completedServices: string[];
  totalSpent: number;
}

export default function AdminClientesPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientSummaryItem[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientSummaryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadClients = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getClientManagementAction();
      if (res.success && res.clients) {
        setClients(res.clients);
        setFilteredClients(res.clients);
      } else {
        setErrorMsg(res.error || 'Erro ao carregar lista de clientes.');
      }
    } catch (err) {
      setErrorMsg('Erro inesperado ao buscar clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredClients(clients);
    } else {
      const term = search.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            (c.phone && c.phone.toLowerCase().includes(term))
        )
      );
    }
  }, [search, clients]);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const formatMembershipDuration = (dateVal: string | Date) => {
    const created = new Date(dateVal);
    const now = new Date();
    const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    if (diffMonths > 1) {
      return `Membro há ${diffMonths} meses`;
    } else if (diffMonths === 1) {
      return 'Membro há 1 mês';
    } else if (diffDays > 0) {
      return `Membro há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
    return 'Entrou hoje';
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-amber-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full border border-amber-500/30 object-cover" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Painel
            </Link>
            <Link
              href="/admin/calendario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendário
            </Link>
            <Link
              href="/admin/servicos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              Serviços
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: typeof window !== 'undefined' ? window.location.origin : '/' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Fidelidade & Histórico</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Gestão de Clientes</h1>
            <p className="text-slate-400 text-sm">Visualize dados pessoais, tempo de cadastro e valor investido na barbearia.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-sm text-slate-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span>Carregando histórico dos clientes...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-12 text-center text-zinc-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-zinc-700" />
            <p className="text-base font-semibold text-slate-300">Nenhum cliente encontrado</p>
            <p className="text-xs text-zinc-500">Tente buscar com outro termo ou aguarde novos cadastros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all space-y-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-base flex-shrink-0">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-100 text-base truncate">{client.name}</h3>
                      <span className="text-xs text-amber-400/90 font-medium block">{formatMembershipDuration(client.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Total Gasto</span>
                    <span className="text-lg font-black text-emerald-400">{formatPrice(client.totalSpent)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="truncate" title={client.email}>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span>{client.phone || 'Não informado'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{client.totalAppointments} agendamento(s) no total</span>
                  </div>

                  {client.completedServices.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.completedServices.slice(0, 3).map((svc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-[10px] text-zinc-300 font-medium border border-zinc-700/60"
                        >
                          {svc}
                        </span>
                      ))}
                      {client.completedServices.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-[10px] text-zinc-400 font-medium">
                          +{client.completedServices.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
