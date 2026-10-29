'use client';
import { CommissionSplit } from '@/components/CommissionSplit';

import { getBarberMetricsDetailedAction } from '@/app/actions/appointment-actions';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import type { BarberDetailedMetricsReport } from '@/core/domain/repositories/AppointmentReportRepository';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  RefreshCw,
  Scissors,
  TrendingUp,
  Trophy,
  UserCheck,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

type BarberPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

interface BarberProfileInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  specialty: string;
}

function AdminBarberMetricsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const barberId = (params?.id as string) || '';

  const paramPeriod = (searchParams.get('period') as BarberPeriod) || 'month';
  const [period, setPeriod] = useState<BarberPeriod>(
    ['today', 'week', 'month', 'year', 'all'].includes(paramPeriod) ? paramPeriod : 'month'
  );

  const [report, setReport] = useState<BarberDetailedMetricsReport | null>(null);
  const [barber, setBarber] = useState<BarberProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Discard out-of-order responses to eliminate race conditions
  const requestIdRef = useRef(0);

  const updateUrlParams = (newPeriod: BarberPeriod) => {
    const q = new URLSearchParams();
    if (newPeriod !== 'month') q.set('period', newPeriod);
    const queryString = q.toString();
    router.replace(
      queryString
        ? `/admin/barbeiros/${barberId}/metricas?${queryString}`
        : `/admin/barbeiros/${barberId}/metricas`,
      { scroll: false }
    );
  };

  const loadMetrics = useCallback(
    async (selectedPeriod: BarberPeriod, isManual = false) => {
      if (!barberId) return;

      const currentReqId = ++requestIdRef.current;

      if (isManual || report) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await getBarberMetricsDetailedAction(selectedPeriod, barberId);

        if (currentReqId !== requestIdRef.current) return;

        if (res.success && res.report) {
          setReport(res.report);
          if (res.barber) {
            setBarber(res.barber);
          }
          setErrorMsg(null);
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          );
        } else {
          setErrorMsg(res.error || 'Erro ao carregar métricas do barbeiro.');
        }
      } catch {
        if (currentReqId === requestIdRef.current) {
          setErrorMsg('Erro inesperado ao buscar dados. Tente novamente.');
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [barberId, report]
  );

  useEffect(() => {
    loadMetrics(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  const handlePeriodChange = (newPeriod: BarberPeriod) => {
    setPeriod(newPeriod);
    updateUrlParams(newPeriod);
    loadMetrics(newPeriod, true);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const totalAppointments = report?.totalAppointments || 0;
  const totalRevenue = report?.totalRevenue || 0;
  const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
  const canceledCount = report?.canceledCount || 0;
  const noShowCount = report?.noShowCount || 0;
  const totalInactive = canceledCount + noShowCount;
  const totalBase = totalAppointments + totalInactive;
  const cancelRate = totalBase > 0 ? ((totalInactive / totalBase) * 100).toFixed(1) : '0';

  const periodOptions: { key: BarberPeriod; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mês' },
    { key: 'year', label: 'Este ano' },
    { key: 'all', label: 'Geral' },
  ];

  const barberDisplayName = barber?.name || 'Profissional';

  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row selection:bg-[#C5A059]/30 pb-20 lg:pb-0">
      {/* 1. Header Administrativo Unificado */}
      <AdminNavbar activePage="barbeiros" />

      <main id="main-content" className="flex-grow px-4 sm:px-6 py-8 w-full space-y-8 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl">
        {/* Breadcrumb & Botão de Retorno ao Painel Geral */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/50">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">
              Painel
            </Link>
            <span>/</span>
            <Link href="/admin/barbeiros" className="hover:text-white transition-colors">
              Equipe
            </Link>
            <span>/</span>
            <span className="text-[#C5A059] font-semibold">{barberDisplayName}</span>
          </div>

          <Link
            href="/admin/barbeiros"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151515] hover:bg-[#1C1C1C] border border-white/10 text-white/80 hover:text-white transition-all text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Equipe
          </Link>
        </div>

        {/* 2. Título, Contexto e Filtros Padronizados */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {barber?.image ? (
                <Image
                  src={barber.image}
                  alt={barberDisplayName}
                  width={52}
                  height={52}
                  className="w-13 h-13 rounded-2xl border border-[#D4AF37]/30 object-cover"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] font-black text-lg">
                  {barberDisplayName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  Desempenho de {barberDisplayName}
                </h1>
                <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                  {barber?.specialty || 'Especialista'} • {barber?.email || 'Profissional da equipe'}
                </p>
              </div>
            </div>

            {/* Timestamp e Recarregamento */}
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
            {/* Intervalo Exato de Datas */}
            {report?.periodLabel ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs text-white/80 font-medium self-start">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  Período: <strong className="text-white font-semibold">{report.periodLabel}</strong>
                </span>
              </div>
            ) : (
              <div />
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

        {/* Indicador de Atualizando Dados (Durante troca de filtros) */}
        {isRefreshing && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#D4AF37] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Atualizando métricas de {barberDisplayName}...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white/70">Carregando métricas...</span>
          </div>
        ) : (
          <div className="space-y-8">
            <CommissionSplit admin revenue={totalRevenue} commission={report?.totalCommission || 0} breakdown={report?.commissionBreakdown} />
            {/* 3. Indicadores Principais (Modelo Padronizado de 4 Cartões) */}
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
                    Faturamento bruto dos atendimentos
                  </span>
                </div>
              </div>

              {/* Card 2: Concluídos */}
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

              {/* Card 3: Cancelamentos & Faltas */}
              <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Cancelamentos & Faltas
                  </span>
                  <div className="p-2.5 bg-[#1C1C1C] text-red-400 rounded-xl border border-white/10">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {totalInactive}
                    </span>
                    <span className="text-xs font-bold text-red-400">
                      ({cancelRate}%)
                    </span>
                  </div>
                  <span className="text-xs text-white/50 block">
                    {totalInactive === 0
                      ? 'Nenhum cancelamento no período'
                      : `${canceledCount} cancelamento(s) e ${noShowCount} falta(s)`}
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

            {/* 4. Evolução no Tempo (AreaChart Unificado) */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>Evolução da Receita</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Faturamento diário gerado por {barberDisplayName} no período selecionado
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
                        <linearGradient id="adminBarberRevenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#adminBarberRevenueGrad)"
                        name="revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5. Distribuição e Ranking por Serviço */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico Donut de Participação */}
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
                    Faturamento gerado por cada serviço executado por {barberDisplayName}
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

            {/* 6. Detalhamento Diário dos Atendimentos */}
            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Detalhamento dos Resultados no Período</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Resumo do volume de atendimentos e faturamento distribuído ao longo dos dias
                  </p>
                </div>
              </div>

              {report?.dailyRevenueChart.length === 0 ? (
                <div className="py-8 text-center text-white/40 text-sm">
                  Sem movimentação registrada para detalhamento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Atendimentos Concluídos</th>
                        <th className="py-3 px-4 text-right">Receita Gerada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {report?.dailyRevenueChart.map((d) => (
                        <tr key={d.date} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-medium text-white">{d.date}</td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1C1C1C] text-white/90 font-medium">
                              {d.count} {d.count === 1 ? 'atendimento' : 'atendimentos'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                            {formatPrice(d.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminBarberMetricsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <AdminBarberMetricsContent />
    </Suspense>
  );
}
