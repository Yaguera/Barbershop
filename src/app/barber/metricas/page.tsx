'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getBarberMetricsAction } from '@/app/actions/admin-actions';
import { BarChart3, Calendar, DollarSign, Scissors, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarberNavbar } from '@/components/barber/BarberNavbar';

interface PerformanceReport {
  chartData: { date: string; count: number; revenue: number }[];
  topServices: { name: string; count: number; revenue: number }[];
}

export default function BarberMetricasPage() {
  const { data: session } = useSession();

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMetrics = async (selectedPeriod: 'day' | 'week' | 'month' | 'all' = period) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBarberMetricsAction('', selectedPeriod);
      if (res.success && res.report) {
        setReport(res.report);
      } else {
        setErrorMsg(res.error || 'Erro ao carregar métricas de desempenho.');
      }
    } catch (err) {
      setErrorMsg('Erro inesperado ao buscar dados.');
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

  const totalAppointments = report?.chartData.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalRevenue = report?.chartData.reduce((sum, item) => sum + item.revenue, 0) || 0;

  return (
    <div className="min-h-screen bg-preto-profundo text-slate-100 flex flex-col selection:bg-amber-500/30">
      <BarberNavbar />

      {/* Content */}
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-amber-400" />
              Minhas Métricas & Desempenho
            </h1>
            <p className="text-slate-400 text-sm">Acompanhe sua evolução, atendimentos realizados e receita gerada.</p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto">
            {(['day', 'week', 'month', 'all'] as const).map((p) => {
              const labels = { day: 'Hoje', week: 'Esta Semana', month: 'Este Mês', all: 'Geral' };
              return (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    period === p
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
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
            <span>Carregando métricas...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 flex items-center gap-5">
                <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Scissors className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 block">Total de Atendimentos</span>
                  <span className="text-3xl font-black text-slate-100">{totalAppointments}</span>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 flex items-center gap-5">
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 block">Receita Bruta Gerada</span>
                  <span className="text-3xl font-black text-emerald-400">{formatPrice(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Evolução Temporal de Atendimentos
              </h2>

              {report?.chartData.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Nenhum atendimento registrado no período selecionado.</div>
              ) : (
                <div className="w-full h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '12px',
                          color: '#f4f4f5',
                        }}
                        formatter={(value: any, name: any) => [
                          name === 'count' ? `${value} atendimentos` : formatPrice(Number(value)),
                          name === 'count' ? 'Atendimentos' : 'Receita',
                        ]}
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Services Ranking */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Ranking de Serviços Mais Realizados
              </h2>

              {report?.topServices.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">Nenhum serviço computado para este período.</div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {report?.topServices.map((svc, index) => (
                    <div key={svc.name} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          index === 0 ? 'bg-amber-500 text-black' : index === 1 ? 'bg-zinc-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}º
                        </span>
                        <div>
                          <span className="font-bold text-slate-100 block">{svc.name}</span>
                          <span className="text-xs text-zinc-400">{svc.count} realização(ões)</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-400 text-base">{formatPrice(svc.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
