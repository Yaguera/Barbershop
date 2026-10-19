"use client";

import {
  deleteManagementGoalAction,
  exportAnalyticalCsvAction,
  getPhaseP4WorkspaceAction,
  upsertManagementGoalAction,
} from "@/app/actions/telemetry-goals-actions";
import type { DashboardPeriod } from "@/components/admin/dashboard-types";
import { insightMoney as money } from "@/components/admin/InsightDetailsDialog";
import {
  GOAL_METRIC_DEFINITIONS,
  type GoalMetricCode,
} from "@/core/utils/telemetry-goals-projection-export";
import type { PhaseP4WorkspaceData } from "@/infra/repositories/PrismaTelemetryGoalsRepository";
import {
  Activity,
  CheckCircle2,
  Compass,
  Download,
  Filter,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const moneyCents = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : money(cents / 100);

const formatGoalValue = (
  val: number | null | undefined,
  unit: "CENTS" | "PERCENT_TENTHS"
) => {
  if (val === null || val === undefined) return "—";
  if (unit === "CENTS") return money(val / 100);
  return `${(val / 10).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
};

export function PhaseP4GovernancePanel({
  period,
  filterSignature,
  barberId,
  barberIds,
  serviceIds,
  origins,
  customStart,
  customEnd,
  receivedRevenueCents,
  realizedProductionCents,
  barbershopContributionCents,
}: {
  period: DashboardPeriod;
  filterSignature: string;
  barberId?: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: string[];
  customStart?: string;
  customEnd?: string;
  receivedRevenueCents: number;
  realizedProductionCents: number;
  barbershopContributionCents: number;
}) {
  const [workspace, setWorkspace] = useState<PhaseP4WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Goal Form State
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalMetric, setGoalMetric] = useState<GoalMetricCode>(
    "RECEIVED_REVENUE_CENTS"
  );
  const [goalInputStr, setGoalInputStr] = useState("");
  const [goalSubmitting, setGoalSubmitting] = useState(false);

  const reqSeq = useRef(0);
  const barbersKey = (barberIds ?? []).join(",");

  const loadWorkspace = useCallback(async () => {
    const seq = ++reqSeq.current;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await getPhaseP4WorkspaceAction({
        period,
        barberId,
        barberIds,
        customStart,
        customEnd,
        actuals: {
          receivedRevenueCents,
          realizedProductionCents,
          barbershopContributionCents,
          occupancyRatePercent: null,
          noShowRatePercent: null,
        },
      });

      if (seq !== reqSeq.current) return;

      if (res.success && res.workspace) {
        setWorkspace(res.workspace);
      } else {
        setErrorMsg(
          res.error ||
            "Não foi possível carregar metas, projeções e funil digital."
        );
      }
    } catch {
      if (seq !== reqSeq.current) return;
      setErrorMsg("Falha ao carregar indicadores da Fase P4.");
    } finally {
      if (seq === reqSeq.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    period,
    barberId,
    barbersKey,
    customStart,
    customEnd,
    receivedRevenueCents,
    realizedProductionCents,
    barbershopContributionCents,
  ]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setErrorMsg(null);
    setFeedbackMsg(null);

    const def = GOAL_METRIC_DEFINITIONS[goalMetric];
    const parsed = Number(goalInputStr.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErrorMsg("Informe um valor numérico positivo para a meta.");
      return;
    }

    const targetValue =
      def.unit === "CENTS"
        ? Math.round(parsed * 100)
        : Math.round(parsed * 10);

    setGoalSubmitting(true);
    try {
      const res = await upsertManagementGoalAction({
        metricCode: goalMetric,
        monthKey: workspace.monthKey,
        barberId,
        targetValue,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao salvar meta.");
      } else {
        setFeedbackMsg(
          `Meta "${def.label}" salva para a competência ${workspace.monthKey}!`
        );
        setGoalInputStr("");
        setShowGoalForm(false);
        await loadWorkspace();
      }
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleDeleteGoal = async (metricCode: GoalMetricCode) => {
    if (!workspace) return;
    setErrorMsg(null);
    setFeedbackMsg(null);
    const res = await deleteManagementGoalAction({
      metricCode,
      monthKey: workspace.monthKey,
      barberId,
    });
    if (!res.success) {
      setErrorMsg(res.error || "Erro ao remover meta.");
    } else {
      setFeedbackMsg("Meta removida (voltou para 'Meta não definida').");
      await loadWorkspace();
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const res = await exportAnalyticalCsvAction({
        period,
        filterSignature,
        barberIds,
        serviceIds,
        origins,
        customStart,
        customEnd,
      });

      if (!res.success || !res.exported) {
        setErrorMsg(res.error || "Falha ao exportar relatório CSV.");
        return;
      }

      const blob = new Blob([res.exported.csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.exported.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedbackMsg(
        `Exportação concluída (${res.exported.rowCount} registros) com proteção contra injeção de fórmulas e evento de auditoria report_exported.`
      );
      await loadWorkspace();
    } finally {
      setExportingCsv(false);
    }
  };

  if (loading && !workspace) {
    return (
      <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#141414] p-6">
        <div className="h-6 w-64 animate-pulse rounded bg-white/10" />
      </section>
    );
  }

  if (!workspace) return null;

  const { funnel, goals, projection, recentEvents } = workspace;

  return (
    <section
      aria-label="Metas, Projeções, Funil Digital e Exportação"
      className="mt-10 space-y-8 border-t border-white/[0.08] pt-10"
    >
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">
            Instrumentação, Metas, Projeções & Exportação · Fase P4
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            Metas Opcionais, Projeção de Fechamento e Funil Digital (7 Dias)
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-zinc-400">
            Metas não configuradas permanecem como &ldquo;Não definida&rdquo;
            (sem números sintéticos). Projeções separam receita observada de
            reservas futuras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGoalForm((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            <Target className="h-3.5 w-3.5" />
            {showGoalForm
              ? "Fechar Configuração de Meta"
              : `Definir Meta (${workspace.monthKey})`}
          </button>

          <button
            type="button"
            disabled={exportingCsv}
            onClick={handleExportCsv}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exportingCsv
              ? "Gerando CSV Auditado..."
              : "Exportar Relatório CSV (Seguro)"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={loadWorkspace}
            className="inline-flex items-center gap-1 font-bold text-red-100 hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold text-emerald-300 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Goal Configuration Form */}
      {showGoalForm && (
        <div className="rounded-2xl border border-amber-500/30 bg-[#141414] p-5">
          <h3 className="text-sm font-bold text-white">
            Configurar Meta ou Teto para a Competência {workspace.monthKey}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Metas de produção e caixa não são intercambiáveis. Metas de
            percentual não são somadas entre meses.
          </p>

          <form
            onSubmit={handleSaveGoal}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Indicador / Rubrica *
              </label>
              <select
                value={goalMetric}
                onChange={(e) =>
                  setGoalMetric(e.target.value as GoalMetricCode)
                }
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              >
                {(
                  Object.keys(GOAL_METRIC_DEFINITIONS) as GoalMetricCode[]
                ).map((code) => (
                  <option key={code} value={code}>
                    {GOAL_METRIC_DEFINITIONS[code].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                {GOAL_METRIC_DEFINITIONS[goalMetric].unit === "CENTS"
                  ? "Valor da Meta / Teto (R$) *"
                  : "Percentual Alvo / Teto (%) *"}
              </label>
              <input
                type="text"
                required
                placeholder={
                  GOAL_METRIC_DEFINITIONS[goalMetric].unit === "CENTS"
                    ? "Ex.: 15000,00"
                    : "Ex.: 75,0"
                }
                value={goalInputStr}
                onChange={(e) => setGoalInputStr(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={goalSubmitting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                {goalSubmitting ? "Salvando..." : "Salvar Meta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. Projeção de Fechamento do Mês (Identificada como Estimativa) */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Projeção de Fim de Mês · Estimativa Linear + Carteira Agendada
            </span>
            <h3 className="mt-0.5 text-base font-bold text-white">
              Cenário de Fechamento Mensal ({projection.monthKey})
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              projection.isEligible
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-zinc-600 bg-zinc-800 text-zinc-300"
            }`}
          >
            {projection.isEligible
              ? `${projection.observedDays}/${projection.totalDaysInMonth} dias observados`
              : "Projeção Linear Inativa"}
          </span>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          {projection.ineligibilityReason || projection.methodologyNote}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              1. Realizado Observado ({projection.observedDays}d)
            </span>
            <p className="mt-1 font-display text-xl font-bold text-white">
              {moneyCents(projection.observedRealizedCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Ritmo médio: {moneyCents(projection.dailyPaceRealizedCents)}/dia
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              2. Reservas Futuras Agendadas
            </span>
            <p className="mt-1 font-display text-xl font-bold text-sky-400">
              {moneyCents(projection.futureScheduledPendingCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {projection.futureScheduledPendingCount} agendamento(s) futuro(s)
              separado(s)
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              3. Piso (Observado + Carteira Futura)
            </span>
            <p className="mt-1 font-display text-xl font-bold text-amber-300">
              {moneyCents(projection.confirmedPlusObservedFloorCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Soma estrita sem extrapolar novos clientes
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300">
                4. Projeção Linear de Fechamento
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-1 font-display text-xl font-bold text-emerald-300">
              {projection.isEligible
                ? moneyCents(projection.linearProjectedRealizedCents)
                : "Aguardando ≥5d"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Caixa projetado:{" "}
              {projection.isEligible
                ? moneyCents(projection.linearProjectedReceivedCents)
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Cartões de Metas e Orçamento Opcionais */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Acompanhamento de Metas e Teto de Custos ({workspace.monthKey})
            </span>
            <h3 className="mt-0.5 text-base font-bold text-white">
              Metas Gerenciais Configuradas vs Realizado
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <div
              key={g.metricCode}
              className="rounded-xl border border-white/[0.06] bg-[#101010] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white">{g.label}</span>
                {g.hasGoal && (
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(g.metricCode)}
                    className="text-zinc-500 hover:text-red-400"
                    title="Remover meta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-zinc-500">Atual: </span>
                  <span className="text-sm font-bold text-white">
                    {formatGoalValue(g.actualValue, g.unit)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500">Meta: </span>
                  <span className="text-sm font-semibold text-amber-300">
                    {g.hasGoal
                      ? formatGoalValue(g.targetValue, g.unit)
                      : "Não definida"}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span
                  className={
                    !g.hasGoal
                      ? "text-zinc-500"
                      : g.favorable
                        ? "font-semibold text-emerald-400"
                        : "font-semibold text-amber-300"
                  }
                >
                  {g.statusLabel}
                </span>
                {g.hasGoal && g.deviationValue !== null && (
                  <span className="text-zinc-400">
                    Desvio:{" "}
                    {g.deviationValue > 0 ? "+" : ""}
                    {formatGoalValue(g.deviationValue, g.unit)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Funil Digital de Agendamento vs Canal Manual da Recepção */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                Funil Digital Online · Janela de {funnel.windowDays} Dias
              </span>
              <h3 className="mt-0.5 text-base font-bold text-white">
                Conversão da Jornada Online vs Reservas Manuais da Recepção
              </h3>
            </div>
            <Filter className="h-4 w-4 text-sky-400" />
          </div>

          <p className="mt-1 text-xs text-zinc-400">{funnel.separationNote}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
              <span className="text-[11px] text-zinc-400">
                1. Jornadas Online Iniciadas
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {funnel.onlineStartedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Evento: <code>booking_started</code>
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
              <span className="text-[11px] text-zinc-400">
                2. Seleção Válida (Serviço+Hora)
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-sky-400">
                {funnel.onlineDetailsSelectedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Avanço:{" "}
                {funnel.onlineSelectionRate !== null
                  ? `${funnel.onlineSelectionRate.toLocaleString("pt-BR")}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
              <span className="text-[11px] text-emerald-300">
                3. Reserva Online Confirmada
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-400">
                {funnel.onlineConfirmedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-200/80">
                Taxa Digital:{" "}
                {funnel.onlineConfirmationRate !== null
                  ? `${funnel.onlineConfirmationRate.toLocaleString("pt-BR")}%`
                  : "Sem base"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Recepção via WhatsApp:</span>
              <span className="ml-2 font-bold text-amber-300">
                {funnel.whatsappCreatedCount} reserva(s)
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Recepção Presencial:</span>
              <span className="ml-2 font-bold text-amber-300">
                {funnel.walkInCreatedCount} reserva(s)
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Total Criado no Período:</span>
              <span className="ml-2 font-bold text-white">
                {funnel.totalAppointmentsCreatedInPeriod} reserva(s)
              </span>
            </div>
          </div>
        </div>

        {/* Trilha de Eventos Internos e Governança */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Telemetria Interna Auditável
              </h3>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Eventos internos deduplicados sem PII (nenhum dado pessoal enviado a
            terceiros).
          </p>

          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
            {recentEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                Nenhum evento de telemetria registrado neste recorte ainda.
              </p>
            ) : (
              recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#101010] px-3 py-2 text-[11px]"
                >
                  <div>
                    <code className="font-bold text-amber-300">
                      {ev.eventName}
                    </code>
                    <p className="text-zinc-500">
                      Canal: {ev.channel || "ONLINE"} · Papel:{" "}
                      {ev.actorRole || "—"}
                    </p>
                  </div>
                  <span className="text-zinc-400">
                    {new Date(ev.occurredAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-[11px] text-zinc-400">
            <Compass className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Índice de Prontidão Analítica: <strong>Fases P0, P1, P2, P3 e P4 concluídas</strong>.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
