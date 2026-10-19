"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AdminInsights,
  InsightDetailFilter,
  InsightPeriod,
  MetricComparisonDelta,
  PaymentMethodFilter,
  TimelinePoint,
} from "@/core/domain/repositories/AdminInsightsRepository";
import type { DashboardFilterState } from "./dashboard-types";
import {
  InsightDetailsDialog,
  insightMoney as money,
} from "./InsightDetailsDialog";

const panel = "rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6";
const click =
  "focus-visible:outline-2 focus-visible:outline-[#D4AF37] hover:bg-white/5 rounded-xl transition-colors cursor-pointer";
const percent = (part: number, total: number) =>
  `${(total ? (part / total) * 100 : 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function DeltaBadge({
  delta,
  periodLabel,
}: {
  delta?: MetricComparisonDelta;
  periodLabel?: string;
}) {
  if (!delta) return null;
  const colorClass =
    delta.favorable === true
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : delta.favorable === false
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-white/15 bg-white/5 text-zinc-300";

  return (
    <div className="mt-2.5 space-y-1">
      <span
        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${colorClass}`}
      >
        {delta.formattedDelta}
      </span>
      <span className="block text-[11px] text-zinc-400 tabular-nums">
        Ref.: {delta.formattedReference}
        {periodLabel ? ` (${periodLabel})` : ""}
      </span>
    </div>
  );
}

export function DashboardAnalytics({
  analytics: a,
  period,
  barberId,
  filterState,
}: {
  analytics: AdminInsights | null;
  period: InsightPeriod;
  barberId: string;
  filterState?: DashboardFilterState;
}) {
  const [basis, setBasis] = useState<
    "receivedCents" | "realizedCents" | "completed"
  >("receivedCents");
  const [timelineView, setTimelineView] = useState<"chart" | "table">("chart");
  const [ranking, setRanking] = useState<
    "completed" | "realizedCents" | "contributionCents"
  >("completed");
  const [matrixMetric, setMatrixMetric] = useState<
    "realizedCents" | "completed" | "contributionCents"
  >("realizedCents");
  const [detail, setDetail] = useState<{
    filter: InsightDetailFilter;
    title: string;
  } | null>(null);

  if (!a) return null;

  const baseBarberIds =
    filterState?.barberIds ??
    a.appliedFilters?.barberIds ??
    (barberId && barberId !== "all" ? [barberId] : []);
  const baseServiceIds =
    filterState?.serviceIds ?? a.appliedFilters?.serviceIds ?? [];
  const baseOrigins = filterState?.origins ?? a.appliedFilters?.origins ?? [];
  const basePaymentMethods =
    filterState?.paymentMethods ?? a.appliedFilters?.paymentMethods ?? [];

  const open = (title: string, extra: Partial<InsightDetailFilter> = {}) =>
    setDetail({
      title,
      filter: {
        period,
        customStart: filterState?.customStart || undefined,
        customEnd: filterState?.customEnd || undefined,
        barberId: baseBarberIds.length === 1 ? baseBarberIds[0] : undefined,
        barberIds: baseBarberIds,
        serviceIds: baseServiceIds,
        origins: baseOrigins,
        paymentMethods: basePaymentMethods,
        kind: "completed",
        ...extra,
      },
    });

  const openDay = (point: TimelinePoint) =>
    open(
      `${
        basis === "receivedCents"
          ? "Recebimentos"
          : basis === "realizedCents"
            ? "Serviços realizados"
            : "Atendimentos concluídos"
      } · ${point.label}`,
      {
        kind: basis === "receivedCents" ? "received" : "completed",
        startDate: point.startDate,
        endDate: point.endDate,
      },
    );

  const barbers = [...a.barbers].sort((x, y) => y[ranking] - x[ranking]);
  const maximum = Math.max(1, ...barbers.map((b) => b[ranking]));
  const commission =
    a.commissionCents ?? a.realizedCents - a.contributionCents;
  const avgServiceTicket =
    a.averageServiceTicketCents ??
    (a.completed > 0 ? Math.round(a.realizedCents / a.completed) : 0);
  const avgVisitTicket =
    a.averageVisitTicketCents ??
    (a.clients > 0 ? Math.round(a.realizedCents / a.clients) : 0);
  const cohortRate =
    a.cohortReceiptRate ??
    (a.realizedCents > 0
      ? Math.round(
          ((a.realizedCents - a.pendingCents) / a.realizedCents) * 1000,
        ) / 10
      : 0);

  const cmp = a.comparison;
  const chartData = a.timeline.map((point, idx) => {
    const refPoint = cmp?.timeline?.[idx];
    return {
      ...point,
      refValue: refPoint ? refPoint[basis] : undefined,
      refLabel: refPoint?.label,
    };
  });

  // Build unique barbers and services for the Barber x Service Matrix
  const matrixCells = a.barberServiceMatrix ?? [];
  const matrixBarbers = Array.from(
    new Map(matrixCells.map((c) => [c.barberId, c.barberName])).entries(),
  );
  const matrixServices = Array.from(
    new Map(matrixCells.map((c) => [c.serviceId, c.serviceName])).entries(),
  );
  const cellLookup = new Map(
    matrixCells.map((c) => [`${c.barberId}::${c.serviceId}`, c]),
  );

  const cards = [
    {
      title: "Recebido no caixa",
      value: money(a.receivedCents),
      note: "Dinheiro, Pix e Cartão já confirmados na recepção neste período",
      kind: "received" as const,
      delta: cmp?.metrics.receivedCents,
    },
    {
      title: "Cortes e serviços feitos",
      value: money(a.realizedCents),
      note: `${a.completed} atendimentos concluídos na cadeira neste período`,
      kind: "completed" as const,
      delta: cmp?.metrics.realizedCents,
    },
    {
      title: "Comissão dos barbeiros",
      value: money(commission),
      note: `${percent(commission, a.realizedCents)} dos serviços feitos · gerada na cadeira`,
      kind: "completed" as const,
      delta: cmp?.metrics.commissionCents,
    },
    {
      title: "Parte da barbearia (Casa)",
      value: money(a.contributionCents),
      note: `${percent(a.contributionCents, a.realizedCents)} dos serviços · o que sobra para pagar contas e lucrar`,
      kind: "completed" as const,
      delta: cmp?.metrics.contributionCents,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 3. Indicadores Principais */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => open(card.title, { kind: card.kind })}
            className={`${panel} ${click} text-left flex flex-col justify-between`}
          >
            <div>
              <span className="text-sm text-zinc-300">{card.title}</span>
              <strong className="mt-2 block text-2xl font-semibold tabular-nums">
                {card.value}
              </strong>
              <DeltaBadge delta={card.delta} periodLabel={cmp?.periodLabel} />
              <span className="mt-2 block text-xs leading-relaxed text-zinc-400">
                {card.note}
              </span>
            </div>
            <span className="mt-3 block text-xs text-[#D4AF37]">
              Ver atendimentos →
            </span>
          </button>
        ))}
      </div>

      {/* Alerta acionável quando houver concluídos sem pagamento confirmado */}
      {a.pendingCents > 0 && (
        <div
          role="region"
          aria-label="Alerta de recebimentos pendentes"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <strong className="text-sm font-semibold text-amber-300 block">
              Atenção ao caixa: {money(a.pendingCents)} em cortes já feitos
              ainda estão sem baixa de pagamento na recepção
            </strong>
            <p className="text-xs text-zinc-300">
              Dos cortes feitos neste período,{" "}
              {cohortRate.toLocaleString("pt-BR")}% já foram pagos no caixa.
              Finalizar o corte na agenda não marca como pago automaticamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                open("Sem recebimento registrado", { kind: "pending" })
              }
              className="min-h-10 rounded-xl bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black hover:bg-[#E2BE4D] transition-colors cursor-pointer"
            >
              Conferir pendentes →
            </button>
            <Link
              href="/atendente/caixa"
              className="min-h-10 inline-flex items-center rounded-xl border border-white/15 bg-[#151515] px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"
            >
              Ir para o Caixa
            </Link>
          </div>
        </div>
      )}

      {/* 4. Evolução do período (com sobreposição de comparação e alternância para Tabela Acessível) */}
      <section className={panel} aria-labelledby="revenue-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="revenue-heading" className="text-lg font-semibold">
              Evolução do período
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Clique em uma barra ou na tabela acessível para inspecionar os
              atendimentos da data.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div
              className="flex items-center rounded-xl border border-white/15 bg-[#1C1C1C] p-1 text-xs"
              role="group"
              aria-label="Modo de visualização da evolução"
            >
              <button
                type="button"
                onClick={() => setTimelineView("chart")}
                className={`min-h-9 rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  timelineView === "chart"
                    ? "bg-[#252525] text-[#D4AF37]"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={timelineView === "chart"}
              >
                Gráfico
              </button>
              <button
                type="button"
                onClick={() => setTimelineView("table")}
                className={`min-h-9 rounded-lg px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  timelineView === "table"
                    ? "bg-[#252525] text-[#D4AF37]"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={timelineView === "table"}
              >
                Tabela acessível
              </button>
            </div>

            <label className="text-xs text-zinc-400">
              Mostrar série
              <select
                aria-label="Base da evolução financeira"
                value={basis}
                onChange={(e) => setBasis(e.target.value as typeof basis)}
                className="mt-1 block min-h-11 rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-sm text-white"
              >
                <option value="receivedCents">Recebido no caixa (R$)</option>
                <option value="realizedCents">Serviços realizados (R$)</option>
                <option value="completed">Atendimentos concluídos (Qtd.)</option>
              </select>
            </label>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {basis === "receivedCents"
            ? "Pela data de confirmação no caixa, inclusive serviços de outros períodos. Somente recebimentos atualmente confirmados."
            : basis === "realizedCents"
              ? "Pela data agendada do atendimento (startTime), inclusive valores ainda não recebidos no caixa."
              : "Quantidade de atendimentos com status concluído (COMPLETED) em cada data do período."}
        </p>

        {timelineView === "chart" ? (
          a.timeline.length ? (
            <div className="mt-6 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#303030" />
                  <XAxis
                    dataKey="label"
                    stroke="#A1A1AA"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    width={65}
                    stroke="#A1A1AA"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) =>
                      basis === "completed"
                        ? `${Number(v)}`
                        : `R$${Number(v) / 100}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    contentStyle={{
                      background: "#151515",
                      borderColor: "#404040",
                      borderRadius: 12,
                    }}
                    formatter={(v, name) => [
                      basis === "completed"
                        ? `${Number(v)} atendimentos`
                        : money(Number(v)),
                      name === "refValue"
                        ? "Período de referência"
                        : basis === "receivedCents"
                          ? "Recebido (Atual)"
                          : basis === "realizedCents"
                            ? "Realizado (Atual)"
                            : "Concluídos (Atual)",
                    ]}
                  />
                  {cmp && <Legend />}
                  <Bar
                    dataKey={basis}
                    name="Período atual"
                    fill="#D4AF37"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={false}
                    onClick={(entry) => {
                      const point = a.timeline.find((p) => p.key === entry.key);
                      if (point) openDay(point);
                    }}
                    className="cursor-pointer"
                  />
                  {cmp && (
                    <Bar
                      dataKey="refValue"
                      name={`Referência (${cmp.periodLabel})`}
                      fill="#52525B"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                      isAnimationActive={false}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-sm text-zinc-400">
              Sem movimentações neste período.
            </p>
          )
        ) : (
          <div className="mt-6 max-h-80 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1C1C1C] text-zinc-400 uppercase">
                  <th className="py-3 px-4">Data / Período</th>
                  <th className="py-3 px-4 text-right">Recebido no Caixa</th>
                  <th className="py-3 px-4 text-right">Serviços Realizados</th>
                  <th className="py-3 px-4 text-right">Qtd. Concluídos</th>
                  {cmp && (
                    <th className="py-3 px-4 text-right text-[#D4AF37]">
                      Ref. ({basis === "completed" ? "Qtd." : "R$"})
                    </th>
                  )}
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {chartData.map((point) => (
                  <tr key={point.key} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {point.label}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-zinc-200">
                      {money(point.receivedCents)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-zinc-200">
                      {money(point.realizedCents)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-zinc-300">
                      {point.completed}
                    </td>
                    {cmp && (
                      <td className="py-2.5 px-4 text-right tabular-nums text-zinc-400">
                        {point.refValue !== undefined
                          ? basis === "completed"
                            ? `${point.refValue}`
                            : money(point.refValue)
                          : "—"}
                      </td>
                    )}
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDay(point)}
                        className="text-[#D4AF37] font-semibold hover:underline cursor-pointer"
                      >
                        Abrir detalhes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <details className="mt-3 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 text-[#D4AF37]">
            Consultar lista rápida de datas e abrir detalhes
          </summary>
          <div className="max-h-60 overflow-auto">
            {a.timeline.map((point) => (
              <button
                key={point.key}
                type="button"
                onClick={() => openDay(point)}
                className={`${click} flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left`}
              >
                <span>{point.label}</span>
                <span className="tabular-nums">
                  {basis === "completed"
                    ? `${point.completed} atendimentos`
                    : money(point[basis])}{" "}
                  <span className="text-[#D4AF37]">→</span>
                </span>
              </button>
            ))}
          </div>
        </details>
      </section>

      {/* 5. Resumo Operacional e Dicionário Financeiro Compacto */}
      <section
        aria-label="Resumo operacional e indicadores complementares"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <button
          type="button"
          onClick={() =>
            open("Cortes feitos sem pagamento registrado", { kind: "pending" })
          }
          className={`${panel} ${click} text-left`}
        >
          <span className="text-xs text-zinc-400">
            Cortes sem baixa no caixa
          </span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums text-amber-300">
            {money(a.pendingCents)}
          </strong>
          <DeltaBadge
            delta={cmp?.metrics.pendingCents}
            periodLabel={cmp?.periodLabel}
          />
          <span className="mt-1 block text-[11px] text-zinc-400">
            Já pagos deste período: {cohortRate.toLocaleString("pt-BR")}% →
          </span>
        </button>

        <div className={panel}>
          <span className="text-xs text-zinc-400">Ticket médio de serviço</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {money(avgServiceTicket)}
          </strong>
          <DeltaBadge
            delta={cmp?.metrics.averageServiceTicketCents}
            periodLabel={cmp?.periodLabel}
          />
          <span className="mt-1 block text-[11px] text-zinc-400">
            Por visita: {money(avgVisitTicket)}
          </span>
        </div>

        <div className={panel}>
          <span className="text-xs text-zinc-400">Clientes atendidos</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {a.clients}
          </strong>
          <DeltaBadge
            delta={cmp?.metrics.clients}
            periodLabel={cmp?.periodLabel}
          />
          <span className="mt-1 block text-[11px] text-zinc-400">
            {a.recurringClients} recorrentes (
            {percent(a.recurringClients, a.clients)})
          </span>
        </div>

        <button
          type="button"
          onClick={() => open("Cancelamentos", { kind: "canceled" })}
          className={`${panel} ${click} text-left`}
        >
          <span className="text-xs text-zinc-400">Cancelamentos</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {a.canceled}
          </strong>
          <DeltaBadge
            delta={cmp?.metrics.canceled}
            periodLabel={cmp?.periodLabel}
          />
          <span className="mt-1 block text-[11px] text-[#D4AF37]">
            Consultar registros →
          </span>
        </button>

        <button
          type="button"
          onClick={() => open("Faltas (No-show)", { kind: "no_show" })}
          className={`${panel} ${click} text-left`}
        >
          <span className="text-xs text-zinc-400">Faltas registradas</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {a.noShow}
          </strong>
          <DeltaBadge
            delta={cmp?.metrics.noShow}
            periodLabel={cmp?.periodLabel}
          />
          <span className="mt-1 block text-[11px] text-[#D4AF37]">
            Consultar registros →
          </span>
        </button>
      </section>

      {/* 6. Desempenho dos profissionais e composição dos serviços */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Desempenho dos barbeiros</h2>
            <select
              aria-label="Ordenar barbeiros por"
              value={ranking}
              onChange={(e) => setRanking(e.target.value as typeof ranking)}
              className="min-h-11 max-w-full rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-sm"
            >
              <option value="completed">Mais atendimentos</option>
              <option value="realizedCents">Valor dos serviços</option>
              <option value="contributionCents">Parte da barbearia</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Parte da barbearia = serviços − comissão. Despesas não incluídas.
          </p>
          <div className="mt-5 space-y-3">
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  open(`Atendimentos de ${b.name}`, {
                    barberId: b.id,
                    barberIds: [b.id],
                  })
                }
                className={`${click} w-full p-3 text-left`}
              >
                <div className="flex justify-between gap-2 text-sm">
                  <strong>{b.name}</strong>
                  <span>
                    {ranking === "completed"
                      ? `${b.completed} atendimentos`
                      : money(b[ranking])}
                  </span>
                </div>
                <div className="my-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D4AF37]"
                    style={{ width: `${(b[ranking] / maximum) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs leading-relaxed text-zinc-400">
                  <span>Serviços: {money(b.realizedCents)}</span>
                  <span>Caixa: {money(b.receivedCents)}</span>
                  <span className="text-[#D4AF37]">
                    Comissão: {money(b.commissionCents)} (
                    {percent(b.commissionCents, b.realizedCents)})
                  </span>
                  <span>
                    Barbearia: {money(b.contributionCents)} (
                    {percent(b.contributionCents, b.realizedCents)})
                  </span>
                </div>
              </button>
            ))}
            {!barbers.length && (
              <p className="py-8 text-sm text-zinc-400">
                Sem atendimentos ou recebimentos no período.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className={panel}>
            <h2 className="text-lg font-semibold">Serviços mais realizados</h2>
            <p className="mt-2 text-xs text-zinc-400">
              Participação nos {a.completed} atendimentos concluídos.
            </p>
            <div className="mt-5 space-y-2">
              {a.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    open(`Serviço · ${s.name}`, {
                      serviceId: s.id,
                      serviceIds: [s.id],
                    })
                  }
                  className={`${click} w-full p-3 text-left`}
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <strong>{s.name}</strong>
                    <span>
                      {s.count} · {s.percentage.toLocaleString("pt-BR")}%
                    </span>
                  </div>
                  <div className="my-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#D4AF37]/75"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {money(s.amountCents)} em serviços
                    {s.contributionCents !== undefined
                      ? ` · Parte da barbearia: ${money(s.contributionCents)}`
                      : ""}{" "}
                    · Ver detalhes →
                  </p>
                </button>
              ))}
              {!a.services.length && (
                <p className="py-8 text-sm text-zinc-400">
                  Nenhum serviço concluído neste período.
                </p>
              )}
            </div>
          </section>

          {/* Pagamentos por Método (Caixa) */}
          <section className={panel}>
            <h2 className="text-lg font-semibold">
              Recebimentos por forma de pagamento
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Distribuição do caixa confirmado ({money(a.receivedCents)}) por
              meio de pagamento.
            </p>
            <div className="mt-4 space-y-2">
              {(a.paymentMethods ?? []).map((pm) => (
                <button
                  key={pm.method}
                  type="button"
                  onClick={() =>
                    open(`Recebimentos · ${pm.label}`, {
                      kind: "received",
                      paymentMethods: [pm.method as PaymentMethodFilter],
                    })
                  }
                  className={`${click} w-full p-3 text-left`}
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <strong>{pm.label}</strong>
                    <span className="tabular-nums font-semibold">
                      {money(pm.amountCents)} (
                      {pm.percentage.toLocaleString("pt-BR")}%)
                    </span>
                  </div>
                  <div className="my-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/80"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {pm.count}{" "}
                    {pm.count === 1
                      ? "recebimento confirmado"
                      : "recebimentos confirmados"}{" "}
                    · Ver registros →
                  </p>
                </button>
              ))}
              {(!a.paymentMethods || a.paymentMethods.length === 0) && (
                <p className="py-6 text-sm text-zinc-400">
                  Nenhum pagamento confirmado no caixa neste período.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 7. Matriz Profissional × Serviço (Requisito obrigatório Fase P1 - Seção 8) */}
      <section className={panel} aria-labelledby="matrix-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="matrix-heading" className="text-lg font-semibold">
              O Que Cada Barbeiro Mais Cortou (Barbeiro × Serviço)
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Veja quais serviços cada profissional mais realizou. Clique em
              qualquer valor para abrir a lista de cortes.
            </p>
          </div>
          <label className="text-xs text-zinc-400">
            Mostrar na tabela
            <select
              aria-label="Métrica exibida na matriz profissional por serviço"
              value={matrixMetric}
              onChange={(e) =>
                setMatrixMetric(e.target.value as typeof matrixMetric)
              }
              className="mt-1 block min-h-10 rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-xs text-white"
            >
              <option value="realizedCents">Valor cortado (R$)</option>
              <option value="contributionCents">
                Parte da barbearia (R$)
              </option>
              <option value="completed">Qtd. de cortes</option>
            </select>
          </label>
        </div>

        {matrixCells.length > 0 ? (
          <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1C1C1C] text-zinc-400 uppercase">
                  <th className="py-3 px-4">Profissional</th>
                  {matrixServices.map(([sId, sName]) => (
                    <th key={sId} className="py-3 px-4 text-right">
                      {sName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {matrixBarbers.map(([bId, bName]) => (
                  <tr key={bId} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {bName}
                    </td>
                    {matrixServices.map(([sId, sName]) => {
                      const cell = cellLookup.get(`${bId}::${sId}`);
                      if (!cell) {
                        return (
                          <td
                            key={sId}
                            className="py-3 px-4 text-right text-zinc-600 tabular-nums"
                          >
                            —
                          </td>
                        );
                      }
                      const displayVal =
                        matrixMetric === "completed"
                          ? `${cell.completed} atend.`
                          : money(cell[matrixMetric]);
                      return (
                        <td key={sId} className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              open(`${bName} · ${sName}`, {
                                barberId: bId,
                                barberIds: [bId],
                                serviceId: sId,
                                serviceIds: [sId],
                              })
                            }
                            className="inline-flex flex-col items-end rounded-lg border border-transparent hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 px-2.5 py-1.5 transition-colors cursor-pointer"
                            title={`Ver atendimentos de ${bName} em ${sName}`}
                          >
                            <strong className="text-white tabular-nums">
                              {displayVal}
                            </strong>
                            <span className="text-[10px] text-zinc-400 tabular-nums">
                              {cell.completed}x · {cell.shareOfBarberRate}% do
                              barbeiro
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-sm text-zinc-400">
            Nenhuma combinação de profissional e serviço concluída para os
            filtros selecionados.
          </p>
        )}
      </section>

      {/* 8. Clientes que mais voltam */}
      <section className={panel}>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Clientes que mais voltam</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Até 10 clientes com mais visitas. Uma visita é um dia com
              atendimento concluído no período.
            </p>
          </div>
          <p className="text-sm text-zinc-300">
            <strong className="text-white">{a.recurringClients}</strong>{" "}
            recorrentes de {a.clients} atendidos ·{" "}
            {percent(a.recurringClients, a.clients)}
          </p>
        </div>
        <ul className="mt-5 divide-y divide-white/10">
          {a.topClients.map((c, i) => (
            <li key={c.key}>
              <button
                onClick={() =>
                  open(`Atendimentos de ${c.name}`, {
                    clientId: c.id,
                    clientType: c.type,
                  })
                }
                className={`${click} flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong className="text-sm">{c.name}</strong>
                    <p className="mt-1 text-xs text-zinc-400">
                      {c.type === "CONTACT"
                        ? "Contato da recepção"
                        : "Cliente cadastrado"}{" "}
                      · Última visita{" "}
                      {c.lastVisit.split("-").reverse().join("/")}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <strong>
                    {c.visits} {c.visits === 1 ? "visita" : "visitas"}
                  </strong>
                  <p className="mt-1 text-xs text-zinc-400">
                    {c.averageDays === null
                      ? "Sem intervalo de retorno ainda"
                      : `Intervalo médio: ${c.averageDays} dias`}{" "}
                    · {money(c.realizedCents)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
        {!a.topClients.length && (
          <p className="py-8 text-sm text-zinc-400">
            Nenhum cliente atendido neste período.
          </p>
        )}
        <p className="mt-4 text-xs text-zinc-400">
          Cadastros e contatos são considerados separadamente; nomes iguais não
          são mesclados.
        </p>
      </section>

      {detail && (
        <InsightDetailsDialog
          filter={detail.filter}
          title={detail.title}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

