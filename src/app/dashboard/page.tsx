'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getClientAppointmentsAction, changeAppointmentStatusAction } from '@/app/actions/appointment-actions';
import { Calendar, Scissors, AlertCircle, RefreshCw, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';

interface ClientAppointment {
  id: string;
  startTime: string | Date;
  status: string;
  serviceName: string;
  servicePrice: number;
  barberName: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const result = await getClientAppointmentsAction();
    if (result.success && result.appointments) {
      setAppointments(result.appointments);
    } else {
      setErrorMsg(result.error || 'Erro ao carregar seus agendamentos.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Tem certeza de que deseja cancelar este agendamento?')) return;
    setCancellingId(appointmentId);
    setErrorMsg(null);

    const result = await changeAppointmentStatusAction({
      appointmentId,
      newStatus: 'CANCELED',
    });

    if (result.success) {
      await loadAppointments();
    } else {
      setErrorMsg(result.error || null);
    }
    setCancellingId(null);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendente</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Finalizado</span>;
      case 'CANCELED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Cancelado</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-400 border border-zinc-800">Não Compareceu</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-preto-classico text-off-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="José Carlos Barber Shop Logo" className="w-10 h-10 rounded-full border border-carvalho/30" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Cliente'}
                  className="w-8 h-8 rounded-full border border-carvalho/20 object-cover"
                />
              )}
              <span className="text-sm text-zinc-350">
                Cliente: <span className="text-white font-semibold">{session?.user?.name}</span>
              </span>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>
            <button
              id="btn-logout"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/25 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-preto-classico tracking-tight">Meus Agendamentos</h1>
            <p className="text-off-white text-sm font-medium">Veja o histórico e status das suas reservas.</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-azul-barbeiro hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Novo Agendamento
          </Link>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Bookings list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-azul-barbeiro" />
              <span>Carregando seus agendamentos...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 space-y-4">
              <p>Você ainda não possui nenhum agendamento registrado.</p>
              <Link href="/" className="inline-block text-azul-barbeiro hover:underline font-bold text-sm">
                Agendar primeiro horário agora →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-150">
              {appointments.map((app) => {
                const startTime = new Date(app.startTime);
                const isPending = app.status === 'PENDING';
                const isCancelling = cancellingId === app.id;

                return (
                  <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-zinc-100 border border-zinc-800 rounded-2xl text-carvalho">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-preto-classico leading-tight">{app.serviceName}</span>
                          {getStatusBadge(app.status)}
                        </div>
                        <span className="block text-sm text-zinc-500">Barbeiro: {app.barberName} • Valor: <span className="text-azul-barbeiro font-semibold">{formatPrice(app.servicePrice)}</span></span>
                        <span className="block text-xs font-semibold text-carvalho flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {startTime.toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {isCancelling ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <RefreshCw className="w-4 h-4 animate-spin text-azul-barbeiro" />
                          Cancelando...
                        </div>
                      ) : isPending ? (
                        <button
                          id={`btn-cancel-client-${app.id}`}
                          onClick={() => handleCancel(app.id)}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-vermelho-classico/10 hover:bg-vermelho-classico/25 text-vermelho-classico transition-colors border border-vermelho-classico/25 cursor-pointer"
                          title="Cancelar Agendamento"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
