'use client';

import {
  AlertTriangle,
  CalendarCheck,
  DollarSign,
  Minus,
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
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
import type { AnalyticsReport } from './dashboard-types';

export function DashboardAnalytics({ analytics }: { analytics: AnalyticsReport | null }) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);

  const totalFinishedAndCanceled =
    (analytics?.completedCount || 0) + (analytics?.canceledCount || 0) + (analytics?.noShowCount || 0);

  const cancellationRate =
    totalFinishedAndCanceled > 0
      ? ((((analytics?.canceledCount || 0) + (analytics?.noShowCount || 0)) / totalFinishedAndCanceled) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-8">
      {/* 1. Indicadores Principais (Grid 1 -> sm:2 -> lg:4) */}
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
              {formatPrice(analytics?.totalRevenue || 0)}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {analytics?.growthTrend === 'up' && (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{analytics.growthPercentage}</span>
                  <span className="text-white/40">vs período anterior</span>
                </>
              )}
              {analytics?.growthTrend === 'down' && (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-bold">{analytics.growthPercentage}</span>
                  <span className="text-white/40">vs período anterior</span>
                </>
              )}
              {analytics?.growthTrend === 'no_basis' && (
                <>
                  <Minus className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/60">Sem base de comparação</span>
                </>
              )}
              {(!analytics?.growthTrend || analytics?.growthTrend === 'neutral') && (
                <>
                  <Minus className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/50">{analytics?.growthPercentage || '0.0%'} vs anterior</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Atendimentos Concluídos */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Concluídos
            </span>
            <div className="p-2.5 bg-[#1C1C1C] text-[#D4AF37] rounded-xl border border-white/10">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
              {analytics?.completedCount || 0}
            </span>
            <span className="text-xs text-white/50 block">
              Atendimentos finalizados com sucesso
            </span>
          </div>
        </div>

        {/* Card 3: Cancelamentos / Ausências */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Cancelamentos & Faltas
            </span>
            <div className="p-2.5 bg-[#1C1C1C] text-red-400 rounded-xl border border-white/10">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
              {(analytics?.canceledCount || 0) + (analytics?.noShowCount || 0)}
            </span>
            <span className="text-xs text-white/50 block">
              {(analytics?.canceledCount || 0) + (analytics?.noShowCount || 0) === 0 ? (
                'Nenhum cancelamento no período'
              ) : (
                <>
                  {analytics?.canceledCount || 0} canc., {analytics?.noShowCount || 0} ausências ({cancellationRate}% da base)
                </>
              )}
            </span>
          </div>
        </div>

        {/* Card 4: Novos Clientes */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Novos Clientes
            </span>
            <div className="p-2.5 bg-[#1C1C1C] text-[#D4AF37] rounded-xl border border-white/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight">
              {analytics?.newClientsCount || 0}
            </span>
            <span className="text-xs text-white/50 block">
              Cadastros na barbearia no período
            </span>
          </div>
        </div>

      </div>

      {/* 2. Gráficos de Evolução no Tempo e Distribuição (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução no Tempo (AreaChart) */}
        <div className="lg:col-span-2 bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Evolução da Receita Gerada
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Faturamento registrado de acordo com o intervalo selecionado
            </p>
          </div>

          {!analytics?.revenueByTime || analytics.revenueByTime.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-white/40 text-sm">
              Nenhuma movimentação registrada para os filtros selecionados.
            </div>
          ) : (
            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueByTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="luxRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="#737373" fontSize={11} tickLine={false} />
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
                    fill="url(#luxRevenueGradient)"
                    name="revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfico 2: Distribuição e Ranking por Serviço */}
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#D4AF37]" />
              Serviços Mais Realizados
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Participação de cada serviço no volume de atendimentos
            </p>
          </div>

          {!analytics?.servicesDistribution || analytics.servicesDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-white/40 text-sm">
              Nenhum serviço realizado no período.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.servicesDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {analytics.servicesDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="#151515" strokeWidth={2} />
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
                        `${value} realiz. (${props.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista Estruturada de Serviços */}
              <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-white/5">
                {analytics.servicesDistribution.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between pt-2 first:pt-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: svc.fill }} />
                      <span className="font-medium text-white/90 truncate">{svc.name}</span>
                    </div>
                    <span className="font-bold text-white/70 ml-2">
                      {svc.value} ({svc.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
