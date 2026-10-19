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
            Metas do Mês, Previsão de Faturamento e Site
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            Suas Metas, Previsão de Fechamento do Mês e Agendamentos pelo Site
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-zinc-400">
            Acompanhe com quanto a barbearia deve fechar o mês se continuar no
            ritmo atual, defina suas metas e veja quantas pessoas estão
            agendando pelo celular/site.
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
              ? "Fechar Meta"
              : `Definir Meta do Mês (${workspace.monthKey})`}
          </button>

          <button
            type="button"
            disabled={exportingCsv}
            onClick={handleExportCsv}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exportingCsv
              ? "Gerando Planilha..."
              : "Baixar Planilha para Excel (CSV)"}
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
            Definir Meta para o Mês {workspace.monthKey}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Escolha qual número você quer acompanhar neste mês e digite o valor
            que deseja alcançar.
          </p>

          <form
            onSubmit={handleSaveGoal}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                O que você quer acompanhar? *
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
                  ? "Valor da Meta (R$) *"
                  : "Porcentagem Desejada (%) *"}
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
              Previsão de Faturamento até o Fim do Mês
            </span>
            <h3 className="mt-0.5 text-base font-bold text-white">
              Com Quanto a Barbearia Deve Fechar o Mês ({projection.monthKey})
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
              ? `Calculado com ${projection.observedDays} de ${projection.totalDaysInMonth} dias do mês`
              : "Disponível para o mês atual"}
          </span>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          {projection.ineligibilityReason || projection.methodologyNote}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              1. Já Cortado até Hoje ({projection.observedDays} dias)
            </span>
            <p className="mt-1 font-display text-xl font-bold text-white">
              {moneyCents(projection.observedRealizedCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Média por dia: {moneyCents(projection.dailyPaceRealizedCents)}/dia
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              2. Já Agendado até o Fim do Mês
            </span>
            <p className="mt-1 font-display text-xl font-bold text-sky-400">
              {moneyCents(projection.futureScheduledPendingCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {projection.futureScheduledPendingCount} cliente(s) já marcado(s)
              na agenda
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
            <span className="text-[11px] text-zinc-400">
              3. Garantido na Agenda (Já Cortado + Agendado)
            </span>
            <p className="mt-1 font-display text-xl font-bold text-amber-300">
              {moneyCents(projection.confirmedPlusObservedFloorCents)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Soma do que já foi feito com o que já está marcado
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300">
                4. Previsão Final (Se Mantiver o Ritmo)
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-1 font-display text-xl font-bold text-emerald-300">
              {projection.isEligible
                ? moneyCents(projection.linearProjectedRealizedCents)
                : "Aguardando ≥5 dias"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Previsão de dinheiro no caixa:{" "}
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
              Suas Metas do Mês ({workspace.monthKey})
            </span>
            <h3 className="mt-0.5 text-base font-bold text-white">
              Metas Definidas vs. O Que Já Foi Alcançado
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
                    Diferença:{" "}
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
                Clientes Agendando pelo Site · Últimos {funnel.windowDays} Dias
              </span>
              <h3 className="mt-0.5 text-base font-bold text-white">
                Quantas Pessoas Abriram a Tela de Agendar e Quantas Confirmaram
              </h3>
            </div>
            <Filter className="h-4 w-4 text-sky-400" />
          </div>

          <p className="mt-1 text-xs text-zinc-400">
            Mostra o caminho do cliente no site/celular, separado dos
            agendamentos feitos manualmente pela recepcionista.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
              <span className="text-[11px] text-zinc-400">
                1. Abriram a Tela de Agendar
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                {funnel.onlineStartedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Clientes que iniciaram a escolha no site
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-4">
              <span className="text-[11px] text-zinc-400">
                2. Escolheram Barbeiro e Hora
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-sky-400">
                {funnel.onlineDetailsSelectedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Avançaram:{" "}
                {funnel.onlineSelectionRate !== null
                  ? `${funnel.onlineSelectionRate.toLocaleString("pt-BR")}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
              <span className="text-[11px] text-emerald-300">
                3. Confirmaram o Agendamento
              </span>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-400">
                {funnel.onlineConfirmedJourneysCount}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-200/80">
                Concluíram a reserva:{" "}
                {funnel.onlineConfirmationRate !== null
                  ? `${funnel.onlineConfirmationRate.toLocaleString("pt-BR")}%`
                  : "Sem base"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Marcados via WhatsApp:</span>
              <span className="ml-2 font-bold text-amber-300">
                {funnel.whatsappCreatedCount} agendamento(s)
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Marcados no Balcão:</span>
              <span className="ml-2 font-bold text-amber-300">
                {funnel.walkInCreatedCount} agendamento(s)
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3 text-xs">
              <span className="text-zinc-400">Total Agendado no Período:</span>
              <span className="ml-2 font-bold text-white">
                {funnel.totalAppointmentsCreatedInPeriod} agendamento(s)
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
                Últimas Ações no Sistema
              </h3>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Registro automático de agendamentos iniciados no site e planilhas
            baixadas.
          </p>

          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
            {recentEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                Nenhuma ação recente registrada neste período ainda.
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
                      Canal: {ev.channel || "ONLINE"} · Perfil:{" "}
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
              Painel Completo: <strong>Financeiro, Agenda, Clientes e Metas ativos</strong>.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
