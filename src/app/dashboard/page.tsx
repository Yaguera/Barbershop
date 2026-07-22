'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getClientAppointmentsAction, changeAppointmentStatusAction } from '@/app/actions/appointment-actions';
import { Calendar, Scissors, AlertCircle, RefreshCw, X, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ClientNavbar } from '@/components/ClientNavbar';

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
      setErrorMsg(result.error || 'Erro ao cancelar agendamento');
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
      <ClientNavbar />

      {/* Content */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl space-y-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-dourado-premium">Área do Cliente</span>
            <h1 className="text-3xl sm:text-4xl font-black text-branco tracking-tight mt-1">Meus Agendamentos</h1>
            <p className="text-off-white/70 text-sm font-medium mt-1">Acompanhe seu histórico de atendimentos e gerencie suas reservas.</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3.5 bg-dourado-premium hover:bg-dourado-dark text-preto-profundo rounded-2xl text-sm font-black transition-all shadow-[0_0_20px_rgba(245,197,66,0.25)] animate-pulse-glow motion-btn self-start sm:self-center flex items-center gap-2 cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            Novo Agendamento
          </Link>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-red-300 text-sm animate-fade-in-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* KPI Analytical Summary Cards (Responsive Grid) */}
        {!isLoading && appointments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="glass p-5 sm:p-6 rounded-3xl border border-branco/10 motion-card flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-branco/50">Total de Reservas</p>
                <h3 className="text-3xl font-black text-branco mt-1">{appointments.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-dourado-premium/15 border border-dourado-premium/30 flex items-center justify-center text-dourado-premium shadow-inner">
                <Scissors className="w-6 h-6" />
              </div>
            </div>

            <div className="glass p-5 sm:p-6 rounded-3xl border border-branco/10 motion-card flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-branco/50">Ativos / Pendentes</p>
                <h3 className="text-3xl font-black text-amber-400 mt-1">
                  {appointments.filter(a => a.status === 'PENDING').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="glass p-5 sm:p-6 rounded-3xl border border-branco/10 motion-card flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-branco/50">Finalizados</p>
                <h3 className="text-3xl font-black text-emerald-400 mt-1">
                  {appointments.filter(a => a.status === 'COMPLETED').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <RefreshCw className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Bookings Container */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="glass border border-branco/10 rounded-3xl flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-dourado-premium" />
              <span className="text-sm font-semibold">Carregando seus agendamentos VIP...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="glass border border-branco/10 rounded-3xl text-center py-24 px-6 text-zinc-400 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-branco/5 border border-branco/10 mx-auto flex items-center justify-center text-dourado-premium">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-branco">Nenhum agendamento encontrado</h3>
                <p className="text-sm text-branco/50 max-w-md mx-auto">Você ainda não agendou nenhum horário. Garanta sua cadeira com um de nossos especialistas VIP agora.</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-dourado-premium text-preto-profundo rounded-2xl font-black text-sm transition-all hover:bg-dourado-dark motion-btn">
                Agendar Primeiro Horário →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((app) => {
                const startTime = new Date(app.startTime);
                const isPending = app.status === 'PENDING';
                const isCancelling = cancellingId === app.id;

                return (
                  <div 
                    key={app.id} 
                    className={`glass p-5 sm:p-6 rounded-3xl border transition-all motion-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isPending ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50' : 'border-branco/10 hover:border-branco/20'
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`p-4 rounded-2xl border shrink-0 flex items-center justify-center ${
                        isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-branco/5 border-branco/10 text-branco/60'
                      }`}>
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-lg sm:text-xl font-black text-branco leading-tight">{app.serviceName}</span>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-branco/60 font-medium">
                          <span>Barbeiro: <strong className="text-branco font-bold">{app.barberName}</strong></span>
                          <span>•</span>
                          <span>Valor: <strong className="text-dourado-premium font-black">{formatPrice(app.servicePrice)}</strong></span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-dourado-premium/90 pt-0.5">
                          <Calendar className="w-4 h-4 text-dourado-premium" />
                          {startTime.toLocaleString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-branco/10 shrink-0">
                      {isCancelling ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-branco/50 px-4 py-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-dourado-premium" />
                          Cancelando...
                        </div>
                      ) : isPending ? (
                        <button
                          id={`btn-cancel-client-${app.id}`}
                          onClick={() => handleCancel(app.id)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors border border-red-500/30 motion-btn cursor-pointer"
                          title="Cancelar Agendamento"
                        >
                          <X className="w-4 h-4" />
                          Cancelar Reserva
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
