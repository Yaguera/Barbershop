import type {
  CalendarFilters,
  CalendarSummary,
  CalendarView,
} from "../domain/repositories/AdminCalendarRepository";
import { getYYYYMMDD } from "./date-utils";

export const calendarStatusLabels = {
  all: "Todos os atendimentos",
  PENDING: "Agendados",
  COMPLETED: "Concluídos",
  CANCELED: "Cancelados",
  NO_SHOW: "Faltas",
};
export const calendarAppointmentStatusLabels: Record<string, string> = {
  PENDING: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Falta",
};
export const calendarPaymentLabels = {
  all: "Todos os pagamentos",
  paid: "Pagamento confirmado",
  unpaid: "Sem confirmação de pagamento",
};
export const calendarMonths = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
export interface CalendarState extends Required<CalendarFilters> {
  view: CalendarView;
  date: string;
}
export const emptyCalendarSummary = (): CalendarSummary => ({
  count: 0,
  pending: 0,
  completed: 0,
  canceled: 0,
  noShow: 0,
  realizedCents: 0,
  receivedCents: 0,
  unpaidCents: 0,
  reservedMinutes: 0,
});
export function validCalendarDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  if (year < 1970 || year > 2100) return false;
  return (
    new Date(Date.UTC(year, month - 1, day, 12)).toISOString().slice(0, 10) ===
    date
  );
}
export function parseCalendarState(
  params: URLSearchParams,
  today: string,
): { state: CalendarState; error: string | null } {
  const context = params.get("context") || "agenda";
  const state = {
    view: params.get("view") || "day",
    date: params.get("date") || today,
    barberId: params.get("barber") || "all",
    status: params.get("status") || "all",
    payment: params.get("payment") || (context === "cash" ? "paid" : "all"),
    context,
  } as CalendarState;
  const valid =
    ["day", "month", "year"].includes(state.view) &&
    validCalendarDate(state.date) &&
    Object.hasOwn(calendarStatusLabels, state.status) &&
    Object.hasOwn(calendarPaymentLabels, state.payment) &&
    ["agenda", "cash"].includes(state.context) &&
    state.barberId.length <= 128 &&
    (state.context !== "cash" || state.payment === "paid");
  return {
    state,
    error: valid
      ? null
      : "O endereço contém uma data ou filtro inválido. Abra a agenda de hoje para continuar.",
  };
}
export function calendarUrl(state: CalendarState) {
  const params = new URLSearchParams({ view: state.view, date: state.date });
  if (state.barberId !== "all") params.set("barber", state.barberId);
  if (state.status !== "all") params.set("status", state.status);
  if (state.payment !== "all") params.set("payment", state.payment);
  if (state.context !== "agenda") params.set("context", state.context);
  return `/admin/calendario?${params}`;
}
export function shiftCalendarDate(
  date: string,
  view: CalendarView,
  offset: number,
) {
  const [year, month, day] = date.split("-").map(Number);
  if (view === "day")
    return new Date(Date.UTC(year, month - 1, day + offset, 12))
      .toISOString()
      .slice(0, 10);
  const target = new Date(
    Date.UTC(
      year + (view === "year" ? offset : 0),
      month - 1 + (view === "month" ? offset : 0),
      1,
      12,
    ),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}
export function calendarDays(date: string): (string | null)[] {
  const [year, month] = date.split("-").map(Number);
  const offset =
    (new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) =>
    i < offset || i >= offset + count
      ? null
      : `${year}-${String(month).padStart(2, "0")}-${String(i - offset + 1).padStart(2, "0")}`,
  );
}
export const calendarToday = () => getYYYYMMDD(new Date());
export const calendarMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const calendarTime = (date: string) =>
  new Date(date).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
export const calendarFullDate = (date: string) =>
  new Date(`${date}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
