'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getBarberMetricsDetailedAction } from '@/app/actions/appointment-actions';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Scissors, 
  Trophy, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import { BarberDetailedMetricsReport } from '@/core/domain/repositories/AppointmentRepository';

export default function BarberMetricasPage() {
  const { data: session } = useSession();

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [report, setReport] = useState<BarberDetailedMetricsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);

  const loadMetrics = async (selectedPeriod: 'day' | 'week' | 'month' | 'all' = period) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBarberMetricsDetailedAction(selectedPeriod);
      if (res.success && res.report) {
        setReport(res.report);
        if (res.barberId) setBarberProfileId(res.barberId);
      } else {
        setErrorMsg(res.error || 'Erro ao carregar métricas detalhadas do barbeiro.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado ao buscar dados de desempenho.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadMetrics();
    }
  }, [session?.user]);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'all') => {
    setPeriod(newPeriod);
    loadMetrics(newPeriod);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const totalAppointments = report?.totalAppointments || 0;
  const totalRevenue = report?.totalRevenue || 0;
  const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-[#D4AF37]/30 font-sans pb-24">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8 w-full space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Dashboard de Alta Densidade
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 mt-1">
              <span>Minhas Métricas & Rendimento</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Dados exclusivos do seu perfil calculados em tempo real com agregação no banco de dados.
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto shadow-xl">
            {(['day', 'week', 'month', 'all'] as const).map((p) => {
              const labels = { day: 'Hoje', week: 'Semana', month: 'Mês Atual', all: 'Geral' };
              return (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    period === p
                      ? 'bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold">Calculando métricas agregadas...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards (Alta Densidade) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-2xl relative overflow-hidden group hover:border-[#D4AF37]/40 transition-all">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-xl group-hover:bg-[#D4AF37]/20 transition-all pointer-events-none" />
                <div className="p-4 bg-[#D4AF37]/15 text-[#D4AF37] rounded-2xl border border-[#D4AF37]/30 shrink-0">
                  <Scissors className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
                    Total de Cortes / Serviços
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white mt-1 block">
                    {totalAppointments}
                  </span>
                  <span className="text-[11px] text-[#22C55E] font-bold mt-1 block">
                    &bull; Status Finalizado
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-2xl relative overflow-hidden group hover:border-[#22C55E]/40 transition-all">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#22C55E]/10 rounded-full blur-xl group-hover:bg-[#22C55E]/20 transition-all pointer-events-none" />
                <div className="p-4 bg-[#22C55E]/15 text-[#22C55E] rounded-2xl border border-[#22C55E]/30 shrink-0">
                  <DollarSign className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
                    Rendimento Acumulado
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-[#22C55E] mt-1 block tracking-tight">
                    {formatPrice(totalRevenue)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Valor total dos serviços
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5 shadow-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
                <div className="p-4 bg-cyan-500/15 text-cyan-400 rounded-2xl border border-cyan-500/30 shrink-0">
                  <TrendingUp className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
                    Ticket Médio por Corte
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-cyan-400 mt-1 block tracking-tight">
                    {formatPrice(avgTicket)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Média por cliente atendido
                  </span>
                </div>
              </div>
            </div>

            {/* Recharts AreaChart: Gráfico de Rendimento */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                    <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                    <span>Gráfico de Rendimento Diário</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Evolução do seu faturamento ao longo das datas deste período.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#D4AF37]">
                    <span className="w-3 h-3 rounded-full bg-[#D4AF37]" /> Receita (R$)
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" /> Atendimentos
                  </span>
                </div>
              </div>

              {report?.dailyRevenueChart.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm font-medium">
                  Nenhum faturamento registrado para o período selecionado.
                </div>
              ) : (
                <div className="w-full h-80 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report?.dailyRevenueChart || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '16px',
                          color: '#f8fafc',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                          padding: '12px 16px'
                        }}
                        formatter={(value: any, name: any) => [
                          name === 'revenue' ? formatPrice(Number(value)) : `${value} cortes`,
                          name === 'revenue' ? 'Faturamento' : 'Volume de Cortes',
                        ]}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
                      <Area yAxisId="right" type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="count" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Grid Inferior: Distribuição de Serviços & Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* PieChart/BarChart: Serviços Mais Realizados */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                    <PieChartIcon className="w-5 h-5 text-[#D4AF37]" />
                    <span>Serviços Mais Realizados</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Distribuição dos cortes executados com base no volume total.
                  </p>
                </div>

                {report?.servicesDistribution.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm font-medium">
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
                          outerRadius={85}
                          innerRadius={55}
                          paddingAngle={4}
                          label={(entry: any) => `${entry.name || ''} (${entry.percentage || 0}%)`}
                          labelLine={false}
                        >
                          {(report?.servicesDistribution || []).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                          }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value} realização(ões) (${props.payload.percentage}%)`,
                            props.payload.name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top Services Ranking Detalhado */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-[#D4AF37]" />
                    <span>Ranking de Receita por Serviço</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Comportamento financeiro de cada especialidade realizada.
                  </p>
                </div>

                {report?.servicesDistribution.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm font-medium">
                    Nenhum serviço registrado neste período.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {report?.servicesDistribution.map((svc, index) => (
                      <div key={svc.name} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            index === 0 ? 'bg-[#D4AF37] text-slate-950 shadow-md' : index === 1 ? 'bg-slate-300 text-slate-950' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {index + 1}º
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm truncate">{svc.name}</span>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: svc.fill }} />
                            </div>
                            <span className="text-xs text-slate-400 block">
                              {svc.count} {svc.count === 1 ? 'atendimento' : 'atendimentos'} ({svc.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-[#22C55E] text-base block">
                            {formatPrice(svc.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                            Total gerado
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
