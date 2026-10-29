'use client';
import { CommissionSplit } from '@/components/CommissionSplit';

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
  Wallet,
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
  YAxis,
} from 'recharts';

export type BarberPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function BarberMetricasContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramPeriod = (searchParams.get('period') as BarberPeriod) || 'month';
  const validPeriod: BarberPeriod = ['today', 'week', 'month', 'year', 'all'].includes(paramPeriod)
    ? paramPeriod
    : 'month';

  const [period, setPeriod] = useState<BarberPeriod>(validPeriod);
  const [report, setReport] = useState<BarberDetailedMetricsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // Sincroniza com histórico do navegador (Voltar / Avançar)
  useEffect(() => {
    const currentParam = (searchParams.get('period') as BarberPeriod) || 'month';
    if (['today', 'week', 'month', 'year', 'all'].includes(currentParam) && currentParam !== period) {
      setPeriod(currentParam);
    }
  }, [searchParams, period]);

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

  // Ordenação do ranking por receita (garante que o ranking respeite faturamento)
  const sortedByRevenue = [...(report?.servicesDistribution || [])].sort(
    (a, b) => b.revenue - a.revenue
  );

  // Total de dias com faturamento registrado no período
  const activeDaysCount = (report?.dailyRevenueChart || []).filter((d) => d.revenue > 0).length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row selection:bg-[#C5A059]/30 font-sans pb-24 lg:pb-0">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main id="main-content" className="flex-grow px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl">
        
        {/* Cabeçalho da Página e Filtros de Período */}
        <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Métricas e Desempenho
              </h1>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Consulte sua comissão estimada, receita acumulada e serviços executados no período.
              </p>
            </div>

            {/* Timestamp e Botão de Atualização Manual */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              {lastUpdated && (
                <span className="text-xs text-white/50">
                  Atualizado às {lastUpdated}
                </span>
              )}
              <button
                type="button"
                onClick={() => loadMetrics(period, true)}
                disabled={isRefreshing || isLoading}
                className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-[#D4AF37] transition-all disabled:opacity-50 cursor-pointer"
                title="Atualizar dados agora"
                aria-label="Atualizar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            {/* Rótulo de Intervalo de Datas Retornado pelo Backend */}
            {report?.periodLabel ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs text-white/80 font-medium self-start">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  Período: <strong className="text-white font-semibold">{report.periodLabel}</strong>
                </span>
              </div>
            ) : (
              <div className="h-7" />
            )}

            {/* Seletor de Períodos com Rolagem Suave para Telas Estreitas (320px+) */}
            <div className="flex items-center gap-1 bg-[#1C1C1C] p-1 rounded-xl border border-white/10 self-start sm:self-auto overflow-x-auto max-w-full pb-1 sm:pb-1 scrollbar-none">
              {periodOptions.map((opt) => {
                const active = period === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handlePeriodChange(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
        </section>

        {/* Mensagem de Erro com Ação de Repetição */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-xs sm:text-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => loadMetrics(period, true)}
              className="px-3 py-1 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Indicador de Carregamento durante Troca de Filtro */}
        {isRefreshing && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-[#D4AF37]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Atualizando valores do período...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-xs font-semibold text-white/70">Carregando métricas...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <CommissionSplit revenue={totalRevenue} commission={totalCommission} breakdown={report?.commissionBreakdown} />
            
            {/* Indicadores Principais Ordenados Conforme a Especificação */}
            {/* Ordem: 1) Comissão Calculada, 2) Atendimentos Concluídos, 3) Receita dos Serviços, 4) Ticket Médio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Comissão Calculada */}
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    Comissão Calculada
                  </span>
                  <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl border border-[#D4AF37]/20">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-bold text-[#D4AF37] block tracking-tight">
                    {formatPrice(totalCommission)}
                  </span>
                  <span className="text-[11px] text-white/50 block">
                    Comissão estimada acumulada no período
                  </span>
                </div>
              </div>

              {/* 2. Atendimentos Concluídos */}
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    Concluídos
                  </span>
                  <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded-xl border border-[#22C55E]/20">
                    <Scissors className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                    {totalAppointments}
                  </span>
                  <span className="text-[11px] text-white/50 block">
                    Serviços finalizados com sucesso
                  </span>
                </div>
              </div>

              {/* 3. Receita dos Serviços */}
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    Receita dos Serviços
                  </span>
                  <div className="p-2 bg-white/5 text-white/80 rounded-xl border border-white/10">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                    {formatPrice(totalRevenue)}
                  </span>
                  <span className="text-[11px] text-white/50 block">
                    Faturamento total bruto gerado
                  </span>
                </div>
              </div>

              {/* 4. Ticket Médio por Atendimento */}
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    Ticket Médio
                  </span>
                  <div className="p-2 bg-white/5 text-[#D4AF37] rounded-xl border border-white/10">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="text-2xl sm:text-3xl font-bold text-white block tracking-tight">
                    {totalAppointments > 0 ? formatPrice(avgTicket) : 'Sem base'}
                  </span>
                  <span className="text-[11px] text-white/50 block">
                    {totalAppointments > 0
                      ? 'Receita dividida por atendimentos'
                      : 'Nenhum atendimento no período'}
                  </span>
                </div>
              </div>

            </div>

            {/* Evolução da Receita no Período (Gráfico de Área + Resumo Textual) */}
            <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>Evolução da Receita</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Movimentação de faturamento ao longo do período selecionado
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37] self-start sm:self-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <span>
                    {activeDaysCount} {activeDaysCount === 1 ? 'dia' : 'dias'} com receita
                  </span>
                </div>
              </div>

              {(report?.dailyRevenueChart || []).length === 0 ? (
                <div className="py-16 text-center text-white/40 text-xs sm:text-sm">
                  Nenhuma movimentação financeira registrada para este intervalo.
                </div>
              ) : (
                <div className="w-full h-72 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report?.dailyRevenueChart || []}>
                      <defs>
                        <linearGradient id="barberRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#737373"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => `R$${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151515',
                          borderColor: '#262626',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
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
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#barberRevenueGradient)"
                        name="revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Distribuição e Ranking por Serviço (Grid 1 Coluna no Mobile, 2 no Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Distribuição de Serviços (Rosca + Tabela Textual Persistente Acessível) */}
              <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#D4AF37]" />
                    <span>Participação por Serviço</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Proporção percentual da quantidade de atendimentos realizados
                  </p>
                </div>

                {(report?.servicesDistribution || []).length === 0 ? (
                  <div className="py-14 text-center text-white/40 text-xs sm:text-sm">
                    Nenhum serviço realizado neste período.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Gráfico Donut */}
                    <div className="w-full h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={report?.servicesDistribution || []}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={48}
                            paddingAngle={3}
                          >
                            {(report?.servicesDistribution || []).map((entry, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={entry.fill}
                                stroke="#151515"
                                strokeWidth={2}
                              />
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

                    {/* Tabela Textual Persistente (Acessível sem Hover no Celular) */}
                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                        Detalhamento Textual
                      </span>
                      <div className="divide-y divide-white/5">
                        {(report?.servicesDistribution || []).map((svc) => (
                          <div
                            key={svc.name}
                            className="py-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: svc.fill }}
                              />
                              <span className="font-medium text-white truncate">
                                {svc.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-right">
                              <span className="text-white/60">
                                {svc.count} {svc.count === 1 ? 'atend.' : 'atend.'}
                              </span>
                              <span className="font-semibold text-[#D4AF37] min-w-[40px]">
                                {svc.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Ranking por Receita Gerada */}
              <section className="bg-[#151515] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#D4AF37]" />
                    <span>Ranking por Receita Gerada</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Serviços ordenados pelo valor total faturado no período
                  </p>
                </div>

                {sortedByRevenue.length === 0 ? (
                  <div className="py-14 text-center text-white/40 text-xs sm:text-sm">
                    Nenhum serviço faturado neste período.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {sortedByRevenue.map((svc, index) => (
                      <div
                        key={svc.name}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
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
                            <span className="font-medium text-white text-xs sm:text-sm block truncate">
                              {svc.name}
                            </span>
                            <span className="text-[11px] text-white/50 block">
                              {svc.count} {svc.count === 1 ? 'atendimento' : 'atendimentos'} ({svc.percentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-400 text-xs sm:text-sm block">
                            {formatPrice(svc.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

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
