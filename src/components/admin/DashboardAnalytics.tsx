"use client";
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
  const [basis, setBasis] = useState<"realizedCents" | "receivedCents">(
    "receivedCents",
  );
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
      `${basis === "receivedCents" ? "Recebimentos" : "Serviços realizados"} · ${point.label}`,
      {
        kind: basis === "receivedCents" ? "received" : "completed",
        startDate: point.startDate,
        endDate: point.endDate,
      },
    );
  const barbers = [...a.barbers].sort((x, y) => y[ranking] - x[ranking]);
  const maximum = Math.max(1, ...barbers.map((b) => b[ranking]));
  const commission = a.realizedCents - a.contributionCents;
  const cards = [
    {
      title: "Recebido no caixa",
      value: money(a.receivedCents),
      note: "Pagamentos confirmados neste período",
      kind: "received" as const,
    },
    {
      title: "Serviços realizados",
      value: money(a.realizedCents),
      note: `${a.completed} atendimentos concluídos no período`,
      kind: "completed" as const,
    },
    {
      title: "Sem recebimento registrado",
      value: money(a.pendingCents),
      note: "Dos serviços concluídos neste período",
      kind: "pending" as const,
    },
    {
      title: "Parte da barbearia",
      value: money(a.contributionCents),
      note: `${percent(a.contributionCents, a.realizedCents)} dos serviços · antes das despesas`,
      kind: "completed" as const,
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => open(card.title, { kind: card.kind })}
            className={`${panel} ${click} text-left`}
          >
            <span className="text-sm text-zinc-300">{card.title}</span>
            <strong className="mt-3 block text-2xl font-semibold tabular-nums">
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
      <div
        className={`${panel} flex flex-wrap items-center justify-between gap-4`}
      >
        <div>
          <h2 className="font-semibold">Divisão dos serviços realizados</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Valores gravados em cada agendamento. Não representam repasses já
            pagos aos barbeiros.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <p>
            Barbeiros{" "}
            <strong className="block text-[#D4AF37]">
              {money(commission)} · {percent(commission, a.realizedCents)}
            </strong>
          </p>
          <p>
            Barbearia{" "}
            <strong className="block">
              {money(a.contributionCents)} ·{" "}
              {percent(a.contributionCents, a.realizedCents)}
            </strong>
          </p>
        </div>
      </div>
      <section className={panel} aria-labelledby="revenue-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="revenue-heading" className="text-lg font-semibold">
              Evolução financeira
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Clique em uma barra para consultar os atendimentos.
            </p>
          </div>
          <label className="text-xs text-zinc-400">
            Mostrar
            <select
              aria-label="Base da evolução financeira"
              value={basis}
              onChange={(e) => setBasis(e.target.value as typeof basis)}
              className="mt-1 block min-h-11 rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-sm text-white"
            >
              <option value="receivedCents">Recebido no caixa</option>
              <option value="realizedCents">Serviços realizados</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {basis === "receivedCents"
            ? "Pela data de confirmação no caixa, inclusive serviços de outros períodos. Somente recebimentos atualmente confirmados."
            : "Pela data do atendimento, inclusive valores ainda não recebidos."}
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
                  tickFormatter={(v) => `R$${Number(v) / 100}`}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{
                    background: "#151515",
                    borderColor: "#404040",
                    borderRadius: 12,
                  }}
                  formatter={(v) => [
                    money(Number(v)),
                    basis === "receivedCents" ? "Recebido" : "Realizado",
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
            Consultar valores e abrir detalhes por data
          </summary>
          <div className="max-h-60 overflow-auto">
            {a.timeline.map((point) => (
              <button
                key={point.key}
                onClick={() => openDay(point)}
                className={`${click} flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left`}
              >
                <span>{point.label}</span>
                <span className="tabular-nums">
                  {money(point[basis])}{" "}
                  <span className="text-[#D4AF37]">→</span>
                </span>
              </button>
            ))}
          </div>
        </details>
      </section>
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
