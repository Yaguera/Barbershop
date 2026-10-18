'use client';

import { getBarbersAction } from '@/app/actions/admin-actions';
import { getAdminInsightsAction } from '@/app/actions/admin-insights-actions';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { DashboardFilters } from '@/components/admin/DashboardFilters';
import {
  InsightDetailsDialog,
  insightMoney as money,
} from '@/components/admin/InsightDetailsDialog';
import type {
  AdminBarberProp,
  DashboardPeriod,
} from '@/components/admin/dashboard-types';
import type {
  AdminInsights,
  InsightDetailFilter,
} from '@/core/domain/repositories/AdminInsightsRepository';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Percent,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

const percent = (part: number, total: number) =>
  `${(total ? (part / total) * 100 : 0).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })}%`;

function AdminFinanceiroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramPeriod =
    (searchParams.get('period') as DashboardPeriod) || 'month';
  const paramBarber = searchParams.get('barber') || 'all';

  const period: DashboardPeriod = [
    'today',
    'yesterday',
    'week',
    'month',
    'prev_month',
    'year',
    'last_7_days',
    'last_30_days',
    'last_90_days',
    'all',
  ].includes(paramPeriod)
    ? paramPeriod
    : 'month';
  const selectedBarberId = paramBarber;

  const [analyticsScope, setAnalyticsScope] = useState('');
  const [analytics, setAnalytics] = useState<AdminInsights | null>(null);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    filter: InsightDetailFilter;
    title: string;
  } | null>(null);

  const requestIdRef = useRef(0);

  const updateUrlParams = (newPeriod: DashboardPeriod, newBarber: string) => {
    const params = new URLSearchParams();
    if (newPeriod !== 'month') params.set('period', newPeriod);
    if (newBarber !== 'all') params.set('barber', newBarber);
    const queryString = params.toString();
    router.replace(
      queryString ? `/admin/financeiro?${queryString}` : '/admin/financeiro',
      { scroll: false }
    );
  };

  const loadFinanceData = useCallback(
    async (
      targetPeriod: DashboardPeriod,
      targetBarber: string,
      isManual = false
    ) => {
      const currentRequestId = ++requestIdRef.current;
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMsg(null);

      try {
        const [analyticsRes, barbersRes] = await Promise.all([
          getAdminInsightsAction(targetPeriod, targetBarber),
          getBarbersAction(),
        ]);

        if (currentRequestId !== requestIdRef.current) return;

        if (analyticsRes.success && analyticsRes.report) {
          setAnalyticsScope(`${targetPeriod}:${targetBarber}`);
          setAnalytics(analyticsRes.report);
          const serverDate = analyticsRes.report.calculatedAt
            ? new Date(analyticsRes.report.calculatedAt)
            : new Date();
          setLastUpdated(
            serverDate.toLocaleTimeString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        } else {
          setErrorMsg(
            analyticsRes.error || 'Erro ao carregar dados financeiros.'
          );
        }

        if (barbersRes.success && barbersRes.barbers) {
          setBarbers(barbersRes.barbers);
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setErrorMsg(
            'Erro inesperado ao consultar indicadores financeiros. Tente novamente.'
          );
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadFinanceData(period, selectedBarberId);
  }, [period, selectedBarberId, loadFinanceData]);

  const openDetail = (
    title: string,
    extra: Partial<InsightDetailFilter> = {}
  ) => {
    setDetail({
      title,
      filter: { period, barberId: selectedBarberId, kind: 'completed', ...extra },
    });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30">
      <AdminNavbar activePage="financeiro" />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 space-y-6 max-w-7xl">
        <DashboardFilters
          period={period}
          selectedBarberId={selectedBarberId}
          barbers={barbers}
          dateIntervalLabel={
            analyticsScope === `${period}:${selectedBarberId}`
              ? analytics?.periodLabel
              : undefined
          }
          lastUpdated={
            analyticsScope === `${period}:${selectedBarberId}`
              ? lastUpdated || undefined
              : undefined
          }
          isRefreshing={isRefreshing}
          onRefresh={() => void loadFinanceData(period, selectedBarberId, true)}
          onPeriodChange={(newPeriod) =>
            updateUrlParams(newPeriod, selectedBarberId)
          }
          onBarberChange={(newBarber) => updateUrlParams(period, newBarber)}
        />

        {/* Atalhos operacionais financeiros */}
        <nav
          className="flex flex-wrap gap-3 text-xs sm:text-sm"
          aria-label="Atalhos financeiros"
        >
          <Link
            href="/admin/calendario?context=cash"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#151515] px-4 text-zinc-200 hover:bg-white/5"
          >
            <CalendarDays className="size-4 text-[#D4AF37]" />
            Auditar caixa diário no calendário
          </Link>
          <Link
            href="/admin/configuracoes/comissoes"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#151515] px-4 text-[#D4AF37] hover:bg-white/5"
          >
            <Percent className="size-4" />
            Política de comissões por serviço
          </Link>
        </nav>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
            <button
              onClick={() =>
                void loadFinanceData(period, selectedBarberId, true)
              }
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {isLoading ||
        (analytics && analyticsScope !== `${period}:${selectedBarberId}`) ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white/70">
              Carregando reconciliação financeira...
            </span>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* 1. Indicadores Reconciliados (Caixa vs Competência de Produção) */}
            <section
              aria-labelledby="reconciliation-heading"
              className="space-y-4"
            >
              <div>
                <h2
                  id="reconciliation-heading"
                  className="text-lg font-semibold text-white flex items-center gap-2"
                >
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                  Reconciliação de Caixa e Produção (Centavos Históricos)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Valores apurados em fuso de negócio (America/Sao_Paulo). Concluir atendimento registra produção; somente a confirmação no caixa registra recebimento.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    openDetail('Recebimentos confirmados no caixa', {
                      kind: 'received',
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    Base: Data de Confirmação no Caixa
                  </span>
                  <h3 className="text-sm text-zinc-200 mt-1">
                    Recebimentos confirmados
                  </h3>
                  <strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">
                    {money(analytics.receivedCents)}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Entradas efetivamente confirmadas no período, inclusive de serviços realizados em datas anteriores.
                  </p>
                  <span className="mt-3 block text-xs text-[#D4AF37]">
                    Ver recebimentos confirmados →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDetail('Valor dos serviços realizados', {
                      kind: 'completed',
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">
                    Base: Data do Atendimento (startTime)
                  </span>
                  <h3 className="text-sm text-zinc-200 mt-1">
                    Valor dos serviços realizados
                  </h3>
                  <strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">
                    {money(analytics.realizedCents)}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    {analytics.completed} atendimentos concluídos · Ticket médio por serviço:{' '}
                    <strong className="text-zinc-200">
                      {money(analytics.averageServiceTicketCents)}
                    </strong>{' '}
                    · Por visita:{' '}
                    <strong className="text-zinc-200">
                      {money(analytics.averageVisitTicketCents)}
                    </strong>
                  </p>
                  <span className="mt-3 block text-xs text-[#D4AF37]">
                    Ver serviços concluídos →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDetail('Serviços do período sem recebimento confirmado', {
                      kind: 'pending',
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                    Base: Coorte de Produção do Período
                  </span>
                  <h3 className="text-sm text-zinc-200 mt-1">
                    Sem recebimento confirmado
                  </h3>
                  <strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">
                    {money(analytics.pendingCents)}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Taxa de recebimento da coorte:{' '}
                    <strong className="text-zinc-200">
                      {analytics.cohortReceiptRate.toLocaleString('pt-BR')}%
                    </strong>{' '}
                    liquidado sobre os serviços deste período.
                  </p>
                  <span className="mt-3 block text-xs text-[#D4AF37]">
                    Conferir pendentes de caixa →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDetail('Comissão calculada dos profissionais', {
                      kind: 'completed',
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    Divisão Histórica Gravada
                  </span>
                  <h3 className="text-sm text-zinc-200 mt-1">
                    Comissão calculada (Barbeiros)
                  </h3>
                  <strong className="mt-2 block text-2xl font-semibold tabular-nums text-[#D4AF37]">
                    {money(analytics.commissionCents)}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Taxa efetiva ponderada:{' '}
                    <strong className="text-zinc-200">
                      {analytics.effectiveCommissionRate.toLocaleString('pt-BR')}%
                    </strong>{' '}
                    dos serviços realizados. Não equivale a comprovante de repasse pago.
                  </p>
                  <span className="mt-3 block text-xs text-[#D4AF37]">
                    Ver composição por atendimento →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDetail('Parte da barbearia antes das despesas', {
                      kind: 'completed',
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-[#151515] p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D4AF37] transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    Contribuição Operacional Bruta
                  </span>
                  <h3 className="text-sm text-zinc-200 mt-1">
                    Parte da barbearia (antes das despesas)
                  </h3>
                  <strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">
                    {money(analytics.contributionCents)}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    {percent(analytics.contributionCents, analytics.realizedCents)} dos serviços realizados (serviços − comissão calculada). Não deduz custos fixos ou variáveis.
                  </p>
                  <span className="mt-3 block text-xs text-[#D4AF37]">
                    Ver detalhamento →
                  </span>
                </button>

                <div className="rounded-2xl border border-dashed border-white/15 bg-[#121212] p-5 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Ainda não disponível (Fase P2)
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-200 mt-1">
                      Despesas reconhecidas, repasses pagos e resultado líquido
                    </h3>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                      O cadastro de despesas, contas a pagar, livro de movimentos imutáveis e baixa de repasses aos barbeiros ainda não está habilitado no banco de dados.
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-500">
                    Nenhum valor sintético é exibido como lucro líquido enquanto o módulo de despesas estiver incompleto.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Divisão Financeira por Profissional */}
            <section
              aria-labelledby="barber-split-heading"
              className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="barber-split-heading" className="text-lg font-semibold">
                    Reconciliação por Profissional
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Comparativo entre serviços concluídos, valores recebidos no caixa, comissão calculada e contribuição para a barbearia.
                  </p>
                </div>
              </div>

              {analytics.barbers.length === 0 ? (
                <p className="py-8 text-sm text-zinc-400">
                  Nenhum registro financeiro ou atendimento concluído para este recorte.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 text-xs">
                        <th className="py-3 pr-4 font-semibold">Profissional</th>
                        <th className="py-3 px-3 font-semibold text-right">Concluídos</th>
                        <th className="py-3 px-3 font-semibold text-right">Serviços (Produção)</th>
                        <th className="py-3 px-3 font-semibold text-right">Confirmado (Caixa)</th>
                        <th className="py-3 px-3 font-semibold text-right">Comissão Calculada</th>
                        <th className="py-3 px-3 font-semibold text-right">Parte da Barbearia</th>
                        <th className="py-3 pl-3 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {analytics.barbers.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 pr-4 font-semibold text-white">
                            {b.name}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums text-zinc-300">
                            {b.completed}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums text-white">
                            {money(b.realizedCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums text-emerald-400">
                            {money(b.receivedCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums text-[#D4AF37]">
                            {money(b.commissionCents)}{' '}
                            <span className="text-xs text-zinc-400">
                              ({percent(b.commissionCents, b.realizedCents)})
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums text-zinc-200">
                            {money(b.contributionCents)}{' '}
                            <span className="text-xs text-zinc-400">
                              ({percent(b.contributionCents, b.realizedCents)})
                            </span>
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openDetail(`Atendimentos de ${b.name}`, {
                                  barberId: b.id,
                                })
                              }
                              className="text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                            >
                              Ver registros →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 3. Matriz de Disponibilidade de Indicadores (P0) */}
            <section
              aria-labelledby="availability-matrix-heading"
              className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6 space-y-4"
            >
              <div>
                <h2
                  id="availability-matrix-heading"
                  className="text-base font-semibold text-white"
                >
                  Matriz de Disponibilidade e Cobertura de Métricas (Fase P0)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Transparência sobre quais indicadores já são medidos com exatidão em centavos e quais dependem de novas tabelas nos próximos ciclos.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Disponível e Reconciliado (Fase P0)</span>
                  </div>
                  <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                    <li>Recebimentos confirmados no caixa (por data de confirmação)</li>
                    <li>Valor dos serviços realizados (por data agendada do serviço)</li>
                    <li>Serviços do período sem recebimento confirmado e taxa da coorte</li>
                    <li>Comissão calculada e percentual efetivo ponderado (snapshot em centavos)</li>
                    <li>Parte da barbearia antes das despesas (serviços − comissão)</li>
                    <li>Ticket médio por serviço e ticket médio por visita (cliente + dia)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Dependente de Novos Dados (Fases P1 a P4)</span>
                  </div>
                  <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                    <li>Comparativos temporais multi-período e filtros multisseleção (P1)</li>
                    <li>Despesas reconhecidas/pagas, categorias de custo e contas a pagar (P2)</li>
                    <li>Repasses pagos aos barbeiros e saldo líquido a pagar por profissional (P2)</li>
                    <li>Livro razão imutável separando correção cadastral de devolução real (P2)</li>
                    <li>Ocupação sobre jornada com histórico de vigência, pausas e bloqueios (P3)</li>
                    <li>Funil digital de conversão e eventos internos de jornada (P4)</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {detail && (
          <InsightDetailsDialog
            filter={detail.filter}
            title={detail.title}
            onClose={() => setDetail(null)}
          />
        )}
      </main>
    </div>
  );
}

export default function AdminFinanceiroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <AdminFinanceiroContent />
    </Suspense>
  );
}
