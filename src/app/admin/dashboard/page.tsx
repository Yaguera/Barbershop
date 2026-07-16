'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAdminDashboardAnalyticsAction, registerBarberAction, getBarbersAction, deleteBarberAction } from '@/app/actions/admin-actions';
import { 
  DollarSign, 
  CalendarCheck, 
  AlertTriangle, 
  UserPlus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Loader2, 
  Scissors, 
  BarChart3, 
  Trash2, 
  TrendingUp, 
  CalendarDays,
  Filter,
  Users,
  PieChart as PieIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface AnalyticsReport {
  totalRevenue: number;
  completedCount: number;
  canceledCount: number;
  newClientsCount: number;
  growthPercentage: string;
  revenueByTime: { timeLabel: string; revenue: number; completed: number }[];
  servicesDistribution: { name: string; value: number; percentage: number; fill: string }[];
}

interface AdminBarberProp {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  workDays: number[];
  workStart: string;
  workEnd: string;
  active?: boolean;
  specialty?: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Filters State
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year'>('month');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Barber Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDashboardData = async (
    targetPeriod: 'today' | 'yesterday' | 'week' | 'month' | 'year' = period,
    targetBarber: string = selectedBarberId
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [analyticsRes, barbersRes] = await Promise.all([
        getAdminDashboardAnalyticsAction(targetPeriod, targetBarber),
        getBarbersAction(),
      ]);

      if (analyticsRes.success && analyticsRes.report) {
        setAnalytics(analyticsRes.report);
      } else {
        setErrorMsg(analyticsRes.error || 'Erro ao carregar métricas analíticas.');
      }

      if (barbersRes.success && barbersRes.barbers) {
        setBarbers(barbersRes.barbers);
      }
    } catch (err) {
      setErrorMsg('Erro inesperado ao buscar dados analíticos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [period, selectedBarberId]);

  const handlePeriodChange = (newPeriod: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    setPeriod(newPeriod);
  };

  const handleBarberFilterChange = (barberId: string) => {
    setSelectedBarberId(barberId);
  };

  const handleDeleteBarber = async (barberId: string, barberName: string) => {
    if (!confirm(`Tem certeza de que deseja desativar o barbeiro ${barberName}? Ele não poderá receber novos agendamentos, mas seu histórico será preservado.`)) return;
    setIsLoading(true);
    const res = await deleteBarberAction(barberId);
    if (res.success) {
      await loadDashboardData(period, selectedBarberId);
    } else {
      setErrorMsg(res.error || 'Erro ao desativar barbeiro.');
      setIsLoading(false);
    }
  };

  const handleRegisterBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess(null);
    setFormError(null);

    const res = await registerBarberAction({
      name,
      email,
      passwordHash: password,
      workDays,
      workStart,
      workEnd,
    });

    if (res.success) {
      setFormSuccess(res.message || 'Barbeiro registrado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      setWorkDays([1, 2, 3, 4, 5]);
      setWorkStart('09:00');
      setWorkEnd('18:00');
      await loadDashboardData(period, selectedBarberId);
    } else {
      setFormError(res.error || 'Erro ao registrar barbeiro.');
    }
    setFormLoading(false);
  };

  const handleDayCheck = (day: number) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter((d) => d !== day));
    } else {
      setWorkDays([...workDays, day].sort());
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const weekdaysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Header */}
      <AdminNavbar activePage="dashboard" />

      {/* Main CRM Analytical Layout */}
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        
        {/* 1. Global Filters Header (Header de Filtros Globais) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              CRM Analítico & Gestão de Desempenho
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Visão de alta densidade em tempo real. Filtre por período e barbeiro para analisar faturamento, agendamentos e conversão.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            {/* Barber Dropdown Filter */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedBarberId}
                onChange={(e) => handleBarberFilterChange(e.target.value)}
                className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-100">Todos os Barbeiros</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Toggle Group */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              {(['today', 'yesterday', 'week', 'month', 'year'] as const).map((p) => {
                const labels = {
                  today: 'Hoje',
                  yesterday: 'Ontem',
                  week: 'Semana',
                  month: 'Mês',
                  year: 'Ano',
                };
                return (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      period === p
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Calendar Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              <CalendarDays className="w-3 h-3" />
              Drill-Down Interativo
            </div>
            <h2 className="text-lg font-extrabold text-slate-100 tracking-tight">
              Visualização Hierárquica em Calendário (Anual &amp; Mensal)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Explore o volume financeiro e de clientes navegando de 12 meses até o detalhe hora a hora do dia.
            </p>
          </div>
          <Link
            href="/admin/calendario"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 flex-shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            Abrir Calendário Interativo
          </Link>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold">Computando agregações analíticas em tempo real...</span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 2. KPI Cards (Grid cols 1 -> md:cols 2 -> lg:cols 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Faturamento Total */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Total</span>
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-3xl font-black text-emerald-400 block tracking-tight">
                    {formatPrice(analytics?.totalRevenue || 0)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{analytics?.growthPercentage || '+0%'}</span>
                    <span>vs período anterior</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Agendamentos Concluídos */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concluídos</span>
                  <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-3xl font-black text-cyan-400 block tracking-tight">
                    {analytics?.completedCount || 0}
                  </span>
                  <span className="text-xs text-slate-400 block">Atendimentos finalizados</span>
                </div>
              </div>

              {/* Card 3: Taxa de Cancelamento */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-colors">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelados / Ausências</span>
                  <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-3xl font-black text-red-400 block tracking-tight">
                    {analytics?.canceledCount || 0}
                  </span>
                  <span className="text-xs text-red-400/90 font-semibold block">
                    {analytics?.canceledCount && (analytics?.completedCount || 0) + (analytics?.canceledCount || 0) > 0
                      ? `${(((analytics.canceledCount) / (analytics.completedCount + analytics.canceledCount)) * 100).toFixed(1)}% do volume total`
                      : 'Taxa controlada'}
                  </span>
                </div>
              </div>

              {/* Card 4: Novos Clientes */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl group-hover:bg-yellow-500/10 transition-all" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Novos Clientes</span>
                  <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <span className="text-3xl font-black text-yellow-400 block tracking-tight">
                    {analytics?.newClientsCount || 0}
                  </span>
                  <span className="text-xs text-slate-400 block">Cadastros no período</span>
                </div>
              </div>

            </div>

            {/* 3. Main Analytical Charts Grid (2/3 + 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* AreaChart: Gráfico de Receita no Tempo */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Receita Bruta Gerada no Tempo (R$)
                    </h3>
                    <p className="text-xs text-slate-400">Evolução temporal do faturamento segundo o corte selecionado</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                    Gradiente Neon
                  </div>
                </div>

                {!analytics?.revenueByTime || analytics.revenueByTime.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                    Nenhum faturamento registrado para os filtros selecionados.
                  </div>
                ) : (
                  <div className="w-full h-80 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.revenueByTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="neonRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                          }}
                          formatter={(value: any, name: any) => [
                            name === 'revenue' ? formatPrice(Number(value)) : `${value} atendimentos`,
                            name === 'revenue' ? 'Receita Bruta' : 'Atendimentos',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#neonRevenue)"
                          name="revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* DonutChart: Gráfico de Serviços Mais Realizados */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-cyan-400" />
                    Distribuição por Serviço
                  </h3>
                  <p className="text-xs text-slate-400">Participação de cada serviço nos atendimentos</p>
                </div>

                {!analytics?.servicesDistribution || analytics.servicesDistribution.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                    Nenhum serviço prestado no período.
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-full h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.servicesDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={5}
                          >
                            {analytics.servicesDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
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
                              `${value} realiz. (${props.payload.percentage}%)`,
                              name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Custom Donut Legend */}
                    <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-slate-800/80">
                      {analytics.servicesDistribution.map((svc) => (
                        <div key={svc.name} className="flex items-center justify-between pt-2 first:pt-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: svc.fill }} />
                            <span className="font-semibold text-slate-200 truncate">{svc.name}</span>
                          </div>
                          <span className="font-extrabold text-slate-300 ml-2">{svc.percentage}% ({svc.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 4. Barbers Team & Registration Section */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Barbers Team List */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    Gestão da Equipe de Barbeiros
                  </h2>

                  {barbers.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                      Nenhum barbeiro cadastrado no sistema.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {barbers.map((b) => (
                        <div
                          key={b.id}
                          className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between gap-3 transition-colors ${
                            b.active !== false ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/40 opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            {b.image ? (
                              <Image
                                src={b.image}
                                alt={b.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full border border-slate-800 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                                {b.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="space-y-1 flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-100 truncate block leading-tight">{b.name}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    b.active !== false
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}
                                >
                                  {b.active !== false ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 block truncate">{b.email}</span>
                              <span className="text-[11px] text-cyan-400/90 font-medium block">{b.specialty || 'Especialista Premium'}</span>
                              <div className="text-[11px] text-slate-500 pt-1">
                                <span className="text-slate-400 font-semibold">Horário:</span> {b.workStart} - {b.workEnd}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                            <Link
                              href={`/admin/barbeiros/${b.id}/metricas`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex-1 justify-center"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              Desempenho
                            </Link>
                            {b.active !== false && (
                              <button
                                onClick={() => handleDeleteBarber(b.id, b.name)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
                                title="Desativar Barbeiro (Soft Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Desativar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Register Barber Form */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    Registrar Barbeiro
                  </h2>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    {formError && (
                      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{formError}</p>
                      </div>
                    )}

                    {formSuccess && (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <p>{formSuccess}</p>
                      </div>
                    )}

                    <form onSubmit={handleRegisterBarber} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Nome</label>
                        <input
                          id="input-barber-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nome do funcionário"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">E-mail</label>
                        <input
                          id="input-barber-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="barbeiro@email.com"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Senha Provisória</label>
                        <input
                          id="input-barber-password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm transition-colors"
                        />
                      </div>

                      {/* Days Checkboxes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Dias de Trabalho</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                            <button
                              key={day}
                              type="button"
                              id={`btn-check-day-${day}`}
                              onClick={() => handleDayCheck(day)}
                              className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-colors cursor-pointer ${
                                workDays.includes(day)
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm font-black'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {weekdaysLabels[day]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Range */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Início</label>
                          <input
                            id="input-barber-start"
                            type="text"
                            required
                            value={workStart}
                            onChange={(e) => setWorkStart(e.target.value)}
                            placeholder="09:00"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm transition-colors text-center font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Término</label>
                          <input
                            id="input-barber-end"
                            type="text"
                            required
                            value={workEnd}
                            onChange={(e) => setWorkEnd(e.target.value)}
                            placeholder="18:00"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm transition-colors text-center font-bold"
                          />
                        </div>
                      </div>

                      <button
                        id="btn-register-barber-submit"
                        type="submit"
                        disabled={formLoading}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {formLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          'Salvar Barbeiro'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
