'use client';

import { getBarberAppointmentsAction, getBarberMetricsDetailedAction } from '@/app/actions/appointment-actions';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarberAppointmentItem {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  clientName: string;
  clientEmail?: string | null;
  clientImage?: string | null;
  serviceName: string;
  servicePrice: number;
}

export default function BarberDashboardHome() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [appointments, setAppointments] = useState<BarberAppointmentItem[]>([]);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
  const [monthMetrics, setMonthMetrics] = useState<{
    totalAppointments: number;
    totalRevenue: number;
    totalCommission: number;
  }>({ totalAppointments: 0, totalRevenue: 0, totalCommission: 0 });

  const requestIdRef = useRef(0);

  const loadDashboardData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setHasError(false);

    try {
      const todayStr = getYYYYMMDD(new Date());
      const [metricsRes, appointmentsRes] = await Promise.all([
        getBarberMetricsDetailedAction('month'),
        getBarberAppointmentsAction(todayStr),
      ]);

      if (currentRequestId !== requestIdRef.current) return;

      if (metricsRes.success && metricsRes.report) {
        setMonthMetrics({
          totalAppointments: metricsRes.report.totalAppointments,
          totalRevenue: metricsRes.report.totalRevenue,
          totalCommission: metricsRes.report.totalCommission || 0,
        });
        if (metricsRes.barberId) {
          setBarberProfileId(metricsRes.barberId);
        }
      }

      if (appointmentsRes.success && appointmentsRes.appointments) {
        setAppointments(appointmentsRes.appointments as BarberAppointmentItem[]);
        if (appointmentsRes.barberId && !barberProfileId) {
          setBarberProfileId(appointmentsRes.barberId);
        }
      } else if (!appointmentsRes.success) {
        setHasError(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados operacionais do barbeiro:', error);
      if (currentRequestId === requestIdRef.current) {
        setHasError(true);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [barberProfileId]);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session?.user, loadDashboardData]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatTime = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  };

  const getTodayFormatted = () => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const nowMs = Date.now();
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const pendingAppointments = sortedAppointments.filter((a) => a.status === 'PENDING');
  const completedToday = sortedAppointments.filter((a) => a.status === 'COMPLETED').length;
  const scheduledToday = pendingAppointments.length;

  const pastPendingAppointments = pendingAppointments.filter(
    (a) => new Date(a.startTime).getTime() < nowMs
  );
  const upcomingAppointments = pendingAppointments.filter(
    (a) => new Date(a.startTime).getTime() >= nowMs
  );

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  const subsequentAppointments = upcomingAppointments.slice(1, 4);

  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'Barbeiro';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col selection:bg-[#D4AF37]/30 font-sans pb-24">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-8">
        
        {/* Cabeçalho Operacional Contextual */}
        <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>{getTodayFormatted()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Olá, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Visão geral dos seus atendimentos do dia e resultados acumulados.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/barber/agenda"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir Agenda</span>
            </Link>
          </div>
        </section>

        {/* Mensagem de Erro com Ação de Recarregamento */}
        {hasError && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#EF4444]">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Não foi possível carregar os dados atualizados no momento.</span>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="px-4 py-1.5 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        )}

        {/* Alerta de Atendimentos Anteriores com Pendência */}
        {pastPendingAppointments.length > 0 && (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
              <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                Há <strong className="text-[#D4AF37] font-semibold">{pastPendingAppointments.length}</strong> {pastPendingAppointments.length === 1 ? 'atendimento' : 'atendimentos'} de horário anterior aguardando conclusão ou atualização.
              </span>
            </div>
            <Link
              href="/barber/agenda"
              className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold transition-colors flex items-center justify-center gap-1 self-start sm:self-auto"
            >
              <span>Resolver na agenda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Bloco: Próximo Atendimento e Resumo do Dia */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card em Destaque: Próximo Atendimento */}
          <section className="lg:col-span-2 bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Próximo Atendimento
                </span>
                <Link
                  href="/barber/agenda"
                  className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Ver na agenda</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {isLoading ? (
                <div className="py-8 flex items-center justify-center text-white/40 gap-2 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Carregando próximo atendimento...</span>
                </div>
              ) : nextAppointment ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1C1C1C] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0D0D0D] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden text-[#D4AF37] font-bold text-sm">
                        {nextAppointment.clientImage ? (
                          <Image
                            src={nextAppointment.clientImage}
                            alt={nextAppointment.clientName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">
                          {nextAppointment.clientName}
                        </h3>
                        <p className="text-xs text-white/60">
                          {nextAppointment.serviceName} · {formatPrice(nextAppointment.servicePrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                      <div className="text-sm sm:text-base font-bold text-[#D4AF37]">
                        {formatTime(nextAppointment.startTime)} - {formatTime(nextAppointment.endTime)}
                      </div>
                      <span className="text-[11px] text-white/50">Horário agendado</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href="/barber/agenda"
                      className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 hover:border-[#D4AF37]/40 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
                    >
                      <span>Gerenciar na agenda</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/40">
                    <CheckCircle2 className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {sortedAppointments.length === 0
                        ? 'Nenhum atendimento agendado para hoje'
                        : pendingAppointments.length === 0
                        ? 'Todos os atendimentos de hoje foram concluídos'
                        : 'Sem próximos atendimentos agendados hoje'}
                    </p>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      {sortedAppointments.length === 0
                        ? 'Os horários marcados pelos clientes para o dia de hoje aparecerão aqui.'
                        : 'Você pode verificar seu histórico ou conferir outros dias na agenda.'}
                    </p>
                  </div>
                  <Link
                    href="/barber/agenda"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all"
                  >
                    <span>Ver agenda completa</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </Link>
                </div>
              )}
            </div>

            {/* Fila curta dos próximos do dia (se houver mais de um) */}
            {subsequentAppointments.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                  A seguir hoje
                </span>
                <div className="space-y-2">
                  {subsequentAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#1C1C1C]/60 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-semibold text-[#D4AF37] shrink-0">
                          {formatTime(app.startTime)}
                        </span>
                        <span className="text-white font-medium truncate">
                          {app.clientName}
                        </span>
                        <span className="text-white/40 hidden sm:inline truncate">
                          · {app.serviceName}
                        </span>
                      </div>
                      <span className="text-white/60 font-medium shrink-0 ml-2">
                        {formatPrice(app.servicePrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Resumo Operacional de Hoje */}
          <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/60 border-b border-white/10 pb-3 mb-4">
                Operação de Hoje
              </h2>

              <div className="space-y-3">
                <div className="bg-[#1C1C1C] p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-white/60 font-medium">Agendados restantes</span>
                    <div className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white/40 my-1" />
                      ) : (
                        scheduledToday
                      )}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-[#1C1C1C] p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-white/60 font-medium">Concluídos hoje</span>
                    <div className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white/40 my-1" />
                      ) : (
                        completedToday
                      )}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-[#1C1C1C] p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-white/60 font-medium">Total programado</span>
                    <div className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white/40 my-1" />
                      ) : (
                        appointments.length
                      )}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white/5 text-white/70 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/barber/agenda"
              className="w-full py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all text-center block"
            >
              Ver agenda do dia
            </Link>
          </section>

        </div>

        {/* Resumo Financeiro e Desempenho do Mês */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span>Resumo do Mês Atual</span>
            </h2>
            <Link 
              href="/barber/metricas" 
              className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver análises</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Atendimentos Concluídos no Mês */}
            <div className="bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-md flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 block">
                  Concluídos no Mês
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-white/40 my-1" />
                  ) : (
                    monthMetrics.totalAppointments
                  )}
                </div>
                <p className="text-[11px] text-white/50">
                  Serviços finalizados no período
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Comissão Estimada */}
            <div className="bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-md flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 block">
                  Comissão Calculada
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]/60 my-1" />
                  ) : (
                    formatPrice(monthMetrics.totalCommission)
                  )}
                </div>
                <p className="text-[11px] text-white/50">
                  Sua comissão acumulada
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Faturamento Bruto */}
            <div className="bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-md flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 block">
                  Faturamento Total
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-white/40 my-1" />
                  ) : (
                    formatPrice(monthMetrics.totalRevenue)
                  )}
                </div>
                <p className="text-[11px] text-white/50">
                  Receita total dos serviços
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 text-white/80 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
