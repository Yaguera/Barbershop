'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getFinanceDashboardAction, registerBarberAction, getBarbersAction, deleteBarberAction } from '@/app/actions/admin-actions';
import { Scissors, DollarSign, Wallet, Percent, UserPlus, RefreshCw, AlertCircle, CheckCircle2, UserCheck, Loader2, LogOut, User, Users, BarChart3, Trash2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AdminFinanceReport {
  grossRevenue: number;
  netRevenue: number;
  barbersCommissions: {
    barberId: string;
    barberName: string;
    commission: number;
  }[];
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
  // Financial Dashboard States
  const [report, setReport] = useState<AdminFinanceReport | null>(null);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

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

  const loadData = async (selectedPeriod: 'today' | 'week' | 'month' | 'year' | 'all' = period) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const financeRes = await getFinanceDashboardAction(selectedPeriod);
      if (financeRes.success && financeRes.report) {
        setReport(financeRes.report);
      } else {
        setErrorMsg(financeRes.error || 'Erro ao carregar dados financeiros.');
      }

      const barbersRes = await getBarbersAction();
      if (barbersRes.success && barbersRes.barbers) {
        setBarbers(barbersRes.barbers);
      }
    } catch (err) {
      setErrorMsg('Erro inesperado ao carregar informações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'year' | 'all') => {
    setPeriod(newPeriod);
    loadData(newPeriod);
  };

  const handleDeleteBarber = async (barberId: string, barberName: string) => {
    if (!confirm(`Tem certeza de que deseja desativar o barbeiro ${barberName}? Ele não poderá receber novos agendamentos, mas seu histórico financeiro será preservado.`)) return;
    setIsLoading(true);
    const res = await deleteBarberAction(barberId);
    if (res.success) {
      await loadData(period);
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
      setFormSuccess(res.message || 'Barbeiro registrado!');
      setName('');
      setEmail('');
      setPassword('');
      setWorkDays([1, 2, 3, 4, 5]);
      setWorkStart('09:00');
      setWorkEnd('18:00');
      // Reload lists
      await loadData();
    } else {
      setFormError(res.error || 'Erro ao registrar.');
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
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="José Carlos Barber Shop Logo" width={40} height={40} className="w-10 h-10 rounded-full border border-amber-500/30 object-cover" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {session?.user && (
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Admin'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-amber-500/20 object-cover"
                  />
                )}
                <span className="text-sm text-slate-400 hidden sm:inline">
                  Admin: <span className="text-slate-200 font-semibold">{session.user.name}</span>
                </span>
              </div>
            )}
            <Link
              href="/admin/calendario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/40 transition-colors shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendário Hierárquico
            </Link>
            <Link
              href="/admin/clientes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Gestão de Clientes
            </Link>
            <Link
              href="/admin/servicos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              Gestão de Serviços
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>
            <button
              id="btn-logout"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Painel Administrativo</h1>
            <p className="text-slate-400 text-sm">Monitore as finanças da barbearia e gerencie os funcionários.</p>
          </div>
          {/* Temporal filters bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
            {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => {
              const labels = { today: 'Hoje', week: 'Semana', month: 'Mês', year: 'Ano', all: 'Geral' };
              return (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

        {/* Hierarchical Calendar Banner Card */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              <CalendarDays className="w-3 h-3" />
              Novo Recurso Interativo
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Visualização Hierárquica em Calendário (Drill-Down)
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Explore o volume de atendimentos navegando do macro para o micro: comece pelo resumo Anual (12 meses), clique no mês para ver a grade de dias com contagem de clientes, e acesse qualquer dia para ver a agenda hora a hora.
            </p>
          </div>
          <Link
            href="/admin/calendario"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 flex-shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            Abrir Calendário Interativo
          </Link>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* 1. Finance Cards (RF09) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-azul-barbeiro" />
            <span>Carregando métricas financeiras...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Gross */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-blue-50 text-azul-barbeiro rounded-2xl">
                <DollarSign className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider block font-bold">Faturamento Bruto</span>
                <span className="text-2xl font-extrabold text-preto-classico block">{formatPrice(report?.grossRevenue || 0)}</span>
              </div>
            </div>

            {/* Card 2: Net */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Wallet className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider block font-bold">Líquido Barbearia</span>
                <span className="text-2xl font-extrabold text-preto-classico block">{formatPrice(report?.netRevenue || 0)}</span>
              </div>
            </div>

            {/* Card 3: Commissions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-zinc-100 text-carvalho rounded-2xl">
                <Percent className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wider block font-bold">Repasses Barbeiros</span>
                <span className="text-2xl font-extrabold text-preto-classico block">
                  {formatPrice(
                    report?.barbersCommissions.reduce((sum: number, b: { commission: number }) => sum + b.commission, 0) || 0
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Manage Barbers and Commissions list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commissions aggregation list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-preto-classico flex items-center gap-2">
                <Scissors className="w-5 h-5 text-carvalho" />
                Repasses Devidos por Barbeiro (RN09.3)
              </h2>

              {isLoading ? (
                <div className="text-zinc-400 text-sm">Carregando repasses...</div>
              ) : report?.barbersCommissions.length === 0 ? (
                <div className="text-zinc-400 text-sm py-4">Nenhum repasse de comissão encontrado.</div>
              ) : (
                <div className="divide-y divide-zinc-150">
                  {report?.barbersCommissions.map((bc) => (
                    <div key={bc.barberId} className="py-3.5 flex justify-between items-center">
                      <div>
                        <span className="block font-bold text-preto-classico">{bc.barberName}</span>
                        <span className="text-xs text-zinc-400">ID: {bc.barberId}</span>
                      </div>
                      <span className="text-lg font-bold text-azul-barbeiro">{formatPrice(bc.commission)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Barbers */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-preto-classico flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-carvalho" />
                Equipe de Barbeiros
              </h2>

              {isLoading ? (
                <div className="text-zinc-400 text-sm">Carregando barbeiros...</div>
              ) : barbers.length === 0 ? (
                <div className="text-zinc-400 text-sm py-4">Nenhum barbeiro cadastrado.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {barbers.map((b) => (
                    <div key={b.id} className={`p-4 bg-zinc-900/60 border rounded-2xl flex flex-col justify-between gap-3 ${
                      b.active !== false ? 'border-zinc-800' : 'border-red-900/40 opacity-70'
                    }`}>
                      <div className="flex items-start gap-3.5">
                        {b.image ? (
                          <Image
                            src={b.image}
                            alt={b.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full border border-zinc-800 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1 flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-100 truncate block leading-tight">{b.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.active !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {b.active !== false ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 block truncate">{b.email}</span>
                          <span className="text-[11px] text-amber-400/90 font-medium block">{b.specialty || 'Especialista Premium'}</span>
                          <div className="text-[11px] text-zinc-500 pt-1">
                            <span className="text-zinc-400 font-semibold">Horário:</span> {b.workStart} - {b.workEnd}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                        <Link
                          href={`/admin/barbeiros/${b.id}/metricas`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors flex-1 justify-center"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Desempenho
                        </Link>
                        {b.active !== false && (
                          <button
                            onClick={() => handleDeleteBarber(b.id, b.name)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-bold transition-colors"
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
          </div>

          {/* Right Column: Register Barber Form (RF02) */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-preto-classico flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-carvalho" />
                Registrar Barbeiro
              </h2>

              {formError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-vermelho-classico" />
                  <p>{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-700 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <p>{formSuccess}</p>
                </div>
              )}

              <form onSubmit={handleRegisterBarber} className="space-y-4 text-off-white">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Nome</label>
                  <input
                    id="input-barber-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do funcionário"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">E-mail</label>
                  <input
                    id="input-barber-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="barbeiro@email.com"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Senha Provisória</label>
                  <input
                    id="input-barber-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-400 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors"
                  />
                </div>

                {/* Days Checkboxes (RN02.1) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Dias de Trabalho</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <button
                        key={day}
                        type="button"
                        id={`btn-check-day-${day}`}
                        onClick={() => handleDayCheck(day)}
                        className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-colors cursor-pointer ${
                          workDays.includes(day)
                            ? 'bg-azul-barbeiro text-white border-azul-barbeiro shadow-sm'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {weekdaysLabels[day]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Range (RN02.1) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Início</label>
                    <input
                      id="input-barber-start"
                      type="text"
                      required
                      value={workStart}
                      onChange={(e) => setWorkStart(e.target.value)}
                      placeholder="09:00"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-450 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Término</label>
                    <input
                      id="input-barber-end"
                      type="text"
                      required
                      value={workEnd}
                      onChange={(e) => setWorkEnd(e.target.value)}
                      placeholder="18:00"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-off-white placeholder-zinc-450 focus:border-azul-barbeiro focus:outline-none text-sm transition-colors text-center"
                    />
                  </div>
                </div>

                <button
                  id="btn-register-barber-submit"
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-azul-barbeiro hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
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
      </main>
    </div>
  );
}
