"use client";
import {
  getAdminCalendarMetricsAction,
  getBarbersAction,
} from "@/app/actions/admin-actions";
import type {
  AdminCalendarResult,
  CalendarPayment,
  CalendarStatus,
} from "@/core/domain/repositories/AdminCalendarRepository";
import {
  calendarFullDate,
  calendarMoney,
  calendarMonths,
  calendarPaymentLabels,
  calendarStatusLabels,
  calendarToday,
  calendarUrl,
  parseCalendarState,
  shiftCalendarDate,
  validCalendarDate,
  type CalendarState,
} from "@/core/utils/admin-calendar";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AdminBarberProp } from "./dashboard-types";
import { CalendarDailyAgenda } from "./CalendarDailyAgenda";
import { CalendarOverview } from "./CalendarOverview";

const panel = "rounded-2xl border border-white/10 bg-[#151515] p-4 sm:p-6";
const control =
  "min-h-11 rounded-xl border border-white/15 bg-[#1C1C1C] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-[#D4AF37]";
const button = `${control} cursor-pointer transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-40`;
type LoadResult = {
  key: string;
  calendar: AdminCalendarResult | null;
  barbers: AdminBarberProp[];
  error: string | null;
};

export function AdminCalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const today = calendarToday();
  const parsed = useMemo(
    () => parseCalendarState(new URLSearchParams(query), today),
    [query, today],
  );
  const state = parsed.state;
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [record, setRecord] = useState<LoadResult | null>(null);
  const key = `${JSON.stringify(state)}:${retry}`;
  useEffect(() => {
    if (parsed.error) return;
    let active = true;
    const [year, month, day] = state.date.split("-").map(Number);
    Promise.all([
      getAdminCalendarMetricsAction(
        year,
        state.view === "year" ? undefined : month,
        state.view === "day" ? day : undefined,
        {
          barberId: state.barberId,
          status: state.status,
          payment: state.payment,
          context: state.context,
        },
      ),
      getBarbersAction(),
    ])
      .then(([calendar, team]) => {
        if (!active) return;
        const barbers = team.success ? team.barbers : [];
        if (!calendar.success || !team.success)
          setRecord({
            key,
            calendar: null,
            barbers,
            error: !calendar.success
              ? calendar.error
              : team.error || "Não foi possível carregar os profissionais.",
          });
        else
          setRecord({ key, calendar: calendar.calendar, barbers, error: null });
      })
      .catch(() => {
        if (active)
          setRecord({
            key,
            calendar: null,
            barbers: [],
            error:
              "Não foi possível carregar o calendário. Verifique a conexão e tente novamente.",
          });
      });
    return () => {
      active = false;
    };
  }, [key, state, parsed.error]);

  if (parsed.error)
    return (
      <div role="alert" className={panel}>
        <p className="text-red-300">{parsed.error}</p>
        <button
          onClick={() => router.replace("/admin/calendario", { scroll: false })}
          className={`${button} mt-4`}
        >
          Abrir agenda de hoje
        </button>
      </div>
    );
  const navigate = (patch: Partial<CalendarState>) =>
    router.push(calendarUrl({ ...state, ...patch }), { scroll: false });
  const loading = record?.key !== key;
  const calendar = !loading ? record?.calendar : null;
  const error = !loading ? record?.error : null;
  const barbers = record?.barbers || [];
  const professional = barbers.find((b) => b.id === state.barberId);
  const filtered =
    state.barberId !== "all" ||
    state.status !== "all" ||
    (state.context === "agenda" && state.payment !== "all");
  const dateTitle =
    state.view === "day"
      ? calendarFullDate(state.date)
      : state.view === "month"
        ? `${calendarMonths[Number(state.date.slice(5, 7)) - 1]} de ${state.date.slice(0, 4)}`
        : state.date.slice(0, 4);
  const prev = shiftCalendarDate(state.date, state.view, -1),
    next = shiftCalendarDate(state.date, state.view, 1);
  const period =
    state.view === "day" ? "dia" : state.view === "month" ? "mês" : "ano";
  return (
    <div className="space-y-6">
      <header className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D4AF37]">ADMINISTRAÇÃO</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">
              Agenda da barbearia
            </h1>
            <p className="mt-2 hidden max-w-xl text-sm sm:block leading-relaxed text-zinc-400">
              Consulte a rotina da equipe e acompanhe os pagamentos confirmados
              no caixa.
            </p>
          </div>
          <button
            onClick={() => setRetry((r) => r + 1)}
            disabled={loading}
            aria-label="Atualizar"
            className={`${button} inline-flex min-w-11 items-center justify-center gap-2`}
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${loading ? "motion-safe:animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
        <div
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Contexto do calendário"
        >
          {(
            [
              { id: "agenda", label: "Agenda de atendimentos" },
              { id: "cash", label: "Recebimentos no caixa" },
            ] as const
          ).map((context) => (
            <button
              key={context.id}
              onClick={() =>
                navigate({
                  context: context.id,
                  payment: context.id === "cash" ? "paid" : "all",
                })
              }
              aria-label={context.label}
              aria-pressed={state.context === context.id}
              className={`${button} ${state.context === context.id ? "border-[#D4AF37]/60 text-[#D4AF37]" : "text-zinc-300"}`}
            >
              <span className="sm:hidden">
                {context.id === "agenda" ? "Agenda" : "Caixa"}
              </span>
              <span className="hidden sm:inline">{context.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {state.context === "cash"
            ? "Pela data de confirmação do pagamento, mesmo que o serviço tenha ocorrido em outro dia. Exclui recebimentos estornados."
            : "Pela data de início do atendimento. Concluído e pago são situações diferentes."}
        </p>
      </header>
      <section className={panel} aria-label="Navegação e filtros">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays
              aria-hidden="true"
              className="size-5 shrink-0 text-[#D4AF37]"
            />
            {dateTitle.charAt(0).toUpperCase() + dateTitle.slice(1)}
          </h2>
          <div
            className="flex gap-1 rounded-xl border border-white/10 bg-[#1C1C1C] p-1"
            aria-label="Visão do calendário"
          >
            {(
              [
                { id: "day", label: "Dia" },
                { id: "month", label: "Mês" },
                { id: "year", label: "Ano" },
              ] as const
            ).map((view) => (
              <button
                key={view.id}
                onClick={() => navigate({ view: view.id })}
                aria-pressed={state.view === view.id}
                className={`min-h-11 cursor-pointer rounded-lg px-4 text-sm focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${state.view === view.id ? "bg-[#D4AF37] font-semibold text-black" : "text-zinc-300 hover:bg-white/5"}`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            <button
              aria-label={`${period === "mês" ? "Mês" : period === "ano" ? "Ano" : "Dia"} anterior`}
              disabled={!validCalendarDate(prev)}
              onClick={() => navigate({ date: prev })}
              className={`${button} min-w-11 px-2`}
            >
              <ChevronLeft aria-hidden="true" className="mx-auto size-4" />
            </button>
            <button
              onClick={() => navigate({ date: calendarToday() })}
              className={button}
            >
              Hoje
            </button>
            <button
              aria-label={`Próximo ${period}`}
              disabled={!validCalendarDate(next)}
              onClick={() => navigate({ date: next })}
              className={`${button} min-w-11 px-2`}
            >
              <ChevronRight aria-hidden="true" className="mx-auto size-4" />
            </button>
          </div>
          <label
            className="min-w-0 text-xs text-zinc-300"
            htmlFor="calendar-date"
          >
            Ir para uma data
            <input
              id="calendar-date"
              type="date"
              min="1970-01-01"
              max="2100-12-31"
              value={state.date}
              onChange={(e) => {
                if (validCalendarDate(e.target.value))
                  navigate({ date: e.target.value });
              }}
              className={`${control} mt-1 block max-w-full [color-scheme:dark]`}
            />
          </label>
        </div>
        <button
          onClick={() => setFiltersExpanded((value) => !value)}
          aria-expanded={filtersExpanded}
          aria-controls="calendar-filter-fields"
          className={`${button} mt-4 w-full md:hidden`}
        >
          Filtros{filtered ? " · ativos" : ""}
          {filtersExpanded ? " −" : " +"}
        </button>
        <div
          id="calendar-filter-fields"
          className={`mt-4 gap-3 border-t border-white/10 pt-4 md:grid md:grid-cols-3 ${filtersExpanded ? "grid" : "hidden"}`}
        >
          <div className="min-w-0 text-xs text-zinc-300">
            <label htmlFor="calendar-barber">Profissional</label>
            <select
              id="calendar-barber"
              value={state.barberId}
              onChange={(e) => navigate({ barberId: e.target.value })}
              className={`${control} mt-1 w-full text-base sm:text-sm`}
            >
              <option value="all">Todos os profissionais</option>
              {state.barberId !== "all" && !professional && (
                <option value={state.barberId}>Profissional selecionado</option>
              )}
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.active === false ? " (inativo)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 text-xs text-zinc-300">
            <label htmlFor="calendar-status">Situação do atendimento</label>
            <select
              id="calendar-status"
              value={state.status}
              onChange={(e) =>
                navigate({ status: e.target.value as CalendarStatus })
              }
              className={`${control} mt-1 w-full text-base sm:text-sm`}
            >
              {Object.entries(calendarStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 text-xs text-zinc-300">
            <label htmlFor="calendar-payment">Pagamento</label>
            <select
              id="calendar-payment"
              value={state.payment}
              disabled={state.context === "cash"}
              onChange={(e) =>
                navigate({ payment: e.target.value as CalendarPayment })
              }
              className={`${control} mt-1 w-full text-base disabled:opacity-70 sm:text-sm`}
            >
              {Object.entries(calendarPaymentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtered && (
          <div
            className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300"
            aria-label="Filtros ativos"
          >
            {state.barberId !== "all" && (
              <span className="rounded-lg bg-white/5 px-2 py-2">
                {professional?.name || "Profissional selecionado"}
                {professional?.active === false ? " (inativo)" : ""}
              </span>
            )}
            {state.status !== "all" && (
              <span className="rounded-lg bg-white/5 px-2 py-2">
                {calendarStatusLabels[state.status]}
              </span>
            )}
            {state.context === "agenda" && state.payment !== "all" && (
              <span className="rounded-lg bg-white/5 px-2 py-2">
                {calendarPaymentLabels[state.payment]}
              </span>
            )}
            <button
              onClick={() =>
                navigate({
                  barberId: "all",
                  status: "all",
                  payment: state.context === "cash" ? "paid" : "all",
                })
              }
              className="min-h-11 cursor-pointer rounded-xl px-3 text-[#D4AF37] focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
      {loading ? (
        <div
          role="status"
          className={`${panel} flex min-h-64 items-center justify-center gap-3 text-sm text-zinc-300`}
        >
          <RefreshCw
            aria-hidden="true"
            className="size-5 text-[#D4AF37] motion-safe:animate-spin"
          />
          Carregando calendário…
        </div>
      ) : error ? (
        <div role="alert" className={panel}>
          <h2 className="font-semibold text-red-300">
            Não foi possível carregar o calendário
          </h2>
          <p className="mt-2 text-sm text-zinc-300">{error}</p>
          <button
            onClick={() => setRetry((r) => r + 1)}
            className={`${button} mt-4`}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        calendar && (
          <>
            <section aria-label="Resumo do período" className="space-y-3">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div className={panel}>
                  <p className="text-sm text-zinc-400">
                    {state.context === "cash"
                      ? "Recebimentos confirmados"
                      : "Total de agendamentos"}
                  </p>
                  <strong className="mt-2 block text-xl font-semibold tabular-nums sm:text-2xl">
                    {calendar.summary.count}
                  </strong>
                  <p className="mt-2 text-xs text-zinc-400">
                    {calendar.startDate.split("-").reverse().join("/")} a{" "}
                    {calendar.endDate.split("-").reverse().join("/")}
                  </p>
                </div>
                <div className={panel}>
                  <p className="text-sm text-zinc-400">
                    {state.context === "cash"
                      ? "Recebido no caixa"
                      : "Serviços concluídos"}
                  </p>
                  <strong className="mt-2 block text-xl font-semibold tabular-nums sm:text-2xl text-[#D4AF37]">
                    {calendarMoney(
                      state.context === "cash"
                        ? calendar.summary.receivedCents
                        : calendar.summary.realizedCents,
                    )}
                  </strong>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {state.context === "cash"
                      ? "Pagamentos atualmente confirmados neste período"
                      : "Valor realizado; pode incluir serviços ainda não pagos"}
                  </p>
                </div>
                <div className={`${panel} col-span-2 lg:col-span-1`}>
                  <p className="text-sm text-zinc-400">
                    {state.context === "cash"
                      ? "Base do relatório"
                      : "Sem recebimento registrado"}
                  </p>
                  {state.context === "cash" ? (
                    <>
                      <strong className="mt-2 block text-xl font-semibold">
                        Data do pagamento
                      </strong>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                        Não é o total dos serviços agendados nestas datas.
                      </p>
                    </>
                  ) : (
                    <>
                      <strong className="mt-2 block text-xl font-semibold tabular-nums sm:text-2xl">
                        {calendarMoney(calendar.summary.unpaidCents)}
                      </strong>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                        Dos serviços concluídos deste período
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { status: "PENDING", key: "pending" },
                    { status: "COMPLETED", key: "completed" },
                    { status: "CANCELED", key: "canceled" },
                    { status: "NO_SHOW", key: "noShow" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      navigate({
                        status:
                          state.status === item.status ? "all" : item.status,
                      })
                    }
                    aria-pressed={state.status === item.status}
                    className={`${button} ${state.status === item.status ? "border-[#D4AF37]/60 text-[#D4AF37]" : "text-zinc-300"}`}
                  >
                    {calendarStatusLabels[item.status]}:{" "}
                    {calendar.summary[item.key]}
                  </button>
                ))}
              </div>
            </section>
            {state.view === "day" ? (
              <CalendarDailyAgenda
                key={key}
                appointments={calendar.appointments}
                context={state.context}
                filtered={filtered}
              />
            ) : (
              <CalendarOverview
                view={state.view}
                date={state.date}
                today={today}
                buckets={calendar.buckets}
                cash={state.context === "cash"}
                onSelect={(date, view) => navigate({ date, view })}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
