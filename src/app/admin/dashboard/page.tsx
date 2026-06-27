'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getFinanceDashboardAction, registerBarberAction, getBarbersAction } from '@/app/actions/admin-actions';
import { Scissors, DollarSign, Wallet, Percent, UserPlus, RefreshCw, AlertCircle, CheckCircle2, UserCheck, Loader2, LogOut, User } from 'lucide-react';
import Link from 'next/link';

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
  workDays: number[];
  workStart: string;
  workEnd: string;
  image?: string | null;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  // Financial Dashboard States
  const [report, setReport] = useState<AdminFinanceReport | null>(null);
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

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const financeRes = await getFinanceDashboardAction();
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
            <img src="/logo.png" alt="José Carlos Barber Shop Logo" className="w-10 h-10 rounded-full border border-amber-500/30" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {session?.user && (
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'Admin'}
                    className="w-8 h-8 rounded-full border border-amber-500/20 object-cover"
                  />
                )}
                <span className="text-sm text-slate-400 hidden sm:inline">
                  Admin: <span className="text-slate-200 font-semibold">{session.user.name}</span>
                </span>
              </div>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-slate-200 border border-zinc-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>
            <button
              id="btn-logout"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
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
        <div>
          <h1 className="text-3xl font-extrabold text-preto-classico tracking-tight">Painel Administrativo</h1>
          <p className="text-off-white text-sm">Monitore as finanças da barbearia e gerencie os funcionários.</p>
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
                    <div key={b.id} className="p-4 bg-zinc-50/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                      {b.image ? (
                        <img
                          src={b.image}
                          alt={b.name}
                          className="w-12 h-12 rounded-full border border-zinc-800 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-carvalho font-bold flex-shrink-0">
                          {b.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1.5 flex-grow">
                        <div>
                          <span className="block font-bold text-preto-classico leading-tight">{b.name}</span>
                          <span className="text-xs text-zinc-400 block">{b.email}</span>
                        </div>
                        <div className="text-xs text-zinc-500 space-y-0.5">
                          <div>
                            <span className="font-semibold text-zinc-400">Horário:</span> {b.workStart} - {b.workEnd}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-400">Dias:</span>{' '}
                            {b.workDays.map((d: number) => weekdaysLabels[d]).join(', ')}
                          </div>
                        </div>
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
