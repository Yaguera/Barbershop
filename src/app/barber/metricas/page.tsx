'use client';

import { getBarberMetricsDetailedAction } from '@/app/actions/appointment-actions';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import type { BarberDetailedMetricsReport } from '@/core/domain/repositories/AppointmentReportRepository';
import {
  AlertCircle,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  RefreshCw,
  Scissors,
  TrendingUp,
  Trophy,
  Wallet
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export type BarberPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function BarberMetricasContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramPeriod = (searchParams.get('period') as BarberPeriod) || 'month';
  const [period, setPeriod] = useState<BarberPeriod>(
    ['today', 'week', 'month', 'year', 'all'].includes(paramPeriod) ? paramPeriod : 'month'
  );

  const [report, setReport] = useState<BarberDetailedMetricsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const updateUrlParam = (newPeriod: BarberPeriod) => {
    const params = new URLSearchParams();
    if (newPeriod !== 'month') params.set('period', newPeriod);
    const queryString = params.toString();
    router.replace(queryString ? `/barber/metricas?${queryString}` : '/barber/metricas', {
      scroll: false,
    });
  };

  const loadMetrics = useCallback(
    async (selectedPeriod: BarberPeriod = period, isManual = false) => {
      const currentRequestId = ++requestIdRef.current;

      if (isManual || report) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await getBarberMetricsDetailedAction(selectedPeriod);

        if (currentRequestId !== requestIdRef.current) return;

        if (res.success && res.report) {
          setReport(res.report);
          setErrorMsg(null);
          if (res.barberId) setBarberProfileId(res.barberId);
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          );
        } else {
          setErrorMsg(res.error || 'Erro ao carregar métricas de desempenho.');
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setErrorMsg('Falha inesperada ao buscar dados. Tente novamente.');
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (session?.user) {
      loadMetrics(period);
    }
  }, [session?.user, period, loadMetrics]);

  const handlePeriodChange = (newPeriod: BarberPeriod) => {
    setPeriod(newPeriod);
    updateUrlParam(newPeriod);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const totalAppointments = report?.totalAppointments || 0;
  const totalRevenue = report?.totalRevenue || 0;
  const totalCommission = report?.totalCommission ?? 0;
  const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  const periodOptions: { key: BarberPeriod; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mês' },
    { key: 'year', label: 'Este ano' },
    { key: 'all', label: 'Geral' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30 pb-24">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {/* 1 & 2. Título, Contexto e Filtros Padronizados */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Meu Desempenho
              </h1>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Acompanhe sua receita gerada, comissão estimada e serviços mais realizados.
              </p>
            </div>

            {/* Timestamp e Ação de Atualizar */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {lastUpdated && (
                <span className="text-xs text-white/50">
                  Atualizado às {lastUpdated}
                </span>
              )}
              <button
                onClick={() => loadMetrics(period, true)}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-[#D4AF37] transition-all disabled:opacity-50 cursor-pointer"
                title="Atualizar dados agora"
                aria-label="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
            {/* Intervalo Exato de Datas */}
            {report?.periodLabel && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs text-white/80 font-medium self-start">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Período: <strong className="text-white font-semibold">{report.periodLabel}</strong></span>
              </div>
            )}

            {/* Seletor de Períodos */}
            <div className="flex items-center gap-1 bg-[#1C1C1C] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
              {periodOptions.map((opt) => {
                const active = period === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handlePeriodChange(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mensagem de Erro com Ação de Tentar Novamente */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
            <button
              onClick={() => loadMetrics(period, true)}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Indicador de Atualizando Dados (Overlay sutil durante troca de filtros) */}
        {isRefreshing && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#D4AF37] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Atualizando métricas...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white/70">Carregando métricas...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 3. Indicadores Principais (Grid 1 -> sm:2 -> lg:4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Receita Gerada */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Receita Gerada
                  </span>
                  <div className="p-2.5 bg-[#1C1C1C] text-[#D4AF37] rounded-xl border border-white/10">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
                    {formatPrice(totalRevenue)}
                  </span>
                  <span className="text-xs text-white/50 block">
                    Faturamento bruto dos serviços
                  </span>
                </div>
              </div>

              {/* Card 2: Minha Comissão */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Minha Comissão
                  </span>
                  <div className="p-2.5 bg-[#1C1C1C] text-emerald-400 rounded-xl border border-white/10">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">
                    {formatPrice(totalCommission)}
                  </span>
                  <span className="text-xs text-white/50 block">
                    Comissão líquida dos atendimentos
                  </span>
                </div>
              </div>

              {/* Card 3: Atendimentos Concluídos */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Concluídos
                  </span>
                  <div className="p-2.5 bg-[#1C1C1C] text-[#D4AF37] rounded-xl border border-white/10">
                    <Scissors className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
                    {totalAppointments}
                  </span>
                  <span className="text-xs text-white/50 block">
                    Atendimentos finalizados com sucesso
                  </span>
                </div>
              </div>

              {/* Card 4: Ticket Médio por Atendimento */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Ticket Médio
                  </span>
                  <div className="p-2.5 bg-[#1C1C1C] text-[#D4AF37] rounded-xl border border-white/10">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
                    {formatPrice(avgTicket)}
                  </span>
                  <span className="text-xs text-white/50 block">
                    Receita dividida por atendimentos
                  </span>
                </div>
              </div>

            </div>

            {/* 4. Evolução no Tempo (AreaChart) */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>Evolução da Receita Gerada</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Faturamento diário/mensal conforme o período selecionado
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <span>Receita (R$)</span>
                </div>
              </div>

              {report?.dailyRevenueChart.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-sm">
                  Nenhuma movimentação registrada para o período selecionado.
                </div>
              ) : (
                <div className="w-full h-80 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report?.dailyRevenueChart || []}>
                      <defs>
                        <linearGradient id="barberRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                      <YAxis stroke="#737373" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151515',
                          borderColor: '#262626',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatPrice(Number(value)) : `${value} atendimentos`,
                          name === 'revenue' ? 'Receita' : 'Atendimentos',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#D4AF37"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#barberRevenueGradient)"
                        name="revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5 & 6. Distribuição e Ranking por Serviço (Grid 1/2 + 1/2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico Donut de Distribuição */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#D4AF37]" />
                    <span>Serviços Mais Realizados</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Participação percentual por quantidade de atendimentos
                  </p>
                </div>

                {report?.servicesDistribution.length === 0 ? (
                  <div className="py-16 text-center text-white/40 text-sm">
                    Nenhum serviço registrado neste período.
                  </div>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report?.servicesDistribution || []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={52}
                          paddingAngle={4}
                        >
                          {(report?.servicesDistribution || []).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} stroke="#151515" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#151515',
                            borderColor: '#262626',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                          }}
                          formatter={(value, name, props) => [
                            `${value} realização(ões) (${props.payload.percentage}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Ranking Financeiro por Serviço */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#D4AF37]" />
                    <span>Ranking por Receita Gerada</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Valor total gerado em cada serviço executado
                  </p>
                </div>

                {report?.servicesDistribution.length === 0 ? (
                  <div className="py-16 text-center text-white/40 text-sm">
                    Nenhum serviço registrado neste período.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {report?.servicesDistribution.map((svc, index) => (
                      <div key={svc.name} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              index === 0
                                ? 'bg-[#D4AF37] text-black shadow-sm'
                                : index === 1
                                ? 'bg-white/20 text-white'
                                : index === 2
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                : 'bg-white/5 text-white/40'
                            }`}
                          >
                            {index + 1}º
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm truncate">{svc.name}</span>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: svc.fill }} />
                            </div>
                            <span className="text-xs text-white/50 block">
                              {svc.count} {svc.count === 1 ? 'atendimento' : 'atendimentos'} ({svc.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-400 text-sm block">
                            {formatPrice(svc.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BarberMetricasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <BarberMetricasContent />
    </Suspense>
  );
}
