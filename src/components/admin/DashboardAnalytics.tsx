"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AdminInsights,
  InsightDetailFilter,
  InsightPeriod,
  TimelinePoint,
} from "@/core/domain/repositories/AdminInsightsRepository";
import {
  InsightDetailsDialog,
  insightMoney as money,
} from "./InsightDetailsDialog";
const panel = "rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6";
const click =
  "focus-visible:outline-2 focus-visible:outline-[#D4AF37] hover:bg-white/5 rounded-xl transition-colors cursor-pointer";
const percent = (part: number, total: number) =>
  `${(total ? (part / total) * 100 : 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export function DashboardAnalytics({
  analytics: a,
  period,
  barberId,
}: {
  analytics: AdminInsights | null;
  period: InsightPeriod;
  barberId: string;
}) {
  const [basis, setBasis] = useState<
    "receivedCents" | "realizedCents" | "completed"
  >("receivedCents");
  const [ranking, setRanking] = useState<
    "completed" | "realizedCents" | "contributionCents"
  >("completed");
  const [detail, setDetail] = useState<{
    filter: InsightDetailFilter;
    title: string;
  } | null>(null);
  if (!a) return null;
  const open = (title: string, extra: Partial<InsightDetailFilter> = {}) =>
    setDetail({
      title,
      filter: { period, barberId, kind: "completed", ...extra },
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
      ? Math.round(((a.realizedCents - a.pendingCents) / a.realizedCents) * 1000) /
        10
      : 0);

  const cards = [
    {
      title: "Recebido no caixa",
      value: money(a.receivedCents),
      note: "Entradas confirmadas no caixa neste período (por data de confirmação)",
      kind: "received" as const,
    },
    {
      title: "Serviços realizados",
      value: money(a.realizedCents),
      note: `${a.completed} atendimentos concluídos no período (por data do serviço)`,
      kind: "completed" as const,
    },
    {
      title: "Comissão calculada",
      value: money(commission),
      note: `${percent(commission, a.realizedCents)} ponderado dos serviços · não representa repasse já pago`,
      kind: "completed" as const,
    },
    {
      title: "Parte da barbearia",
      value: money(a.contributionCents),
      note: `${percent(a.contributionCents, a.realizedCents)} dos serviços · antes das despesas (despesas ainda não cadastradas)`,
      kind: "completed" as const,
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
            className={`${panel} ${click} text-left`}
          >
            <span className="text-sm text-zinc-300">{card.title}</span>
            <strong className="mt-2 block text-2xl font-semibold tabular-nums">
              {card.value}
            </strong>
            <span className="mt-2 block text-xs leading-relaxed text-zinc-400">
              {card.note}
            </span>
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
              Atenção ao caixa: {money(a.pendingCents)} em serviços concluídos no período estão sem recebimento confirmado
            </strong>
            <p className="text-xs text-zinc-300">
              Taxa de recebimento da coorte atual: {cohortRate.toLocaleString("pt-BR")}% liquidado. Concluir o atendimento não registra entrada automática no caixa.
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

      {/* 4. Evolução do período */}
      <section className={panel} aria-labelledby="revenue-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="revenue-heading" className="text-lg font-semibold">
              Evolução do período
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Clique em uma barra ou na tabela abaixo para inspecionar os atendimentos da data.
            </p>
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
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {basis === "receivedCents"
            ? "Pela data de confirmação no caixa, inclusive serviços de outros períodos. Somente recebimentos atualmente confirmados."
            : basis === "realizedCents"
              ? "Pela data agendada do atendimento (startTime), inclusive valores ainda não recebidos no caixa."
              : "Quantidade de atendimentos com status concluído (COMPLETED) em cada data do período."}
        </p>
        {a.timeline.length ? (
          <div className="mt-6 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={a.timeline}
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
                  formatter={(v) => [
                    basis === "completed"
                      ? `${Number(v)} atendimentos`
                      : money(Number(v)),
                    basis === "receivedCents"
                      ? "Recebido"
                      : basis === "realizedCents"
                        ? "Realizado"
                        : "Concluídos",
                  ]}
                />
                <Bar
                  dataKey={basis}
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-sm text-zinc-400">
            Sem movimentações neste período.
          </p>
        )}
        <details className="mt-3 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 text-[#D4AF37]">
            Consultar valores em tabela acessível e abrir detalhes por data
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
            open("Sem recebimento registrado", { kind: "pending" })
          }
          className={`${panel} ${click} text-left`}
        >
          <span className="text-xs text-zinc-400">Sem recebimento (coorte)</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums text-amber-300">
            {money(a.pendingCents)}
          </strong>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Taxa liquidada: {cohortRate.toLocaleString("pt-BR")}% →
          </span>
        </button>

        <div className={panel}>
          <span className="text-xs text-zinc-400">Ticket médio de serviço</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {money(avgServiceTicket)}
          </strong>
          <span className="mt-1 block text-[11px] text-zinc-400">
            Por visita: {money(avgVisitTicket)}
          </span>
        </div>

        <div className={panel}>
          <span className="text-xs text-zinc-400">Clientes atendidos</span>
          <strong className="mt-1 block text-lg font-semibold tabular-nums">
            {a.clients}
          </strong>
          <span className="mt-1 block text-[11px] text-zinc-400">
            {a.recurringClients} recorrentes ({percent(a.recurringClients, a.clients)})
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
                  open(`Atendimentos de ${b.name}`, { barberId: b.id })
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
        <section className={panel}>
          <h2 className="text-lg font-semibold">Serviços mais realizados</h2>
          <p className="mt-2 text-xs text-zinc-400">
            Participação nos {a.completed} atendimentos concluídos.
          </p>
          <div className="mt-5 space-y-2">
            {a.services.map((s) => (
              <button
                key={s.id}
                onClick={() => open(`Serviço · ${s.name}`, { serviceId: s.id })}
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
                  {money(s.amountCents)} em serviços · Ver detalhes →
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
      </div>
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
      <div className="flex flex-wrap gap-3 text-sm">
        <button
          className={`${click} min-h-11 border border-white/10 px-4`}
          onClick={() => open("Cancelamentos", { kind: "canceled" })}
        >
          Cancelamentos: {a.canceled} →
        </button>
        <button
          className={`${click} min-h-11 border border-white/10 px-4`}
          onClick={() => open("Faltas", { kind: "no_show" })}
        >
          Faltas: {a.noShow} →
        </button>
      </div>
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
