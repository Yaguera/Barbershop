"use client";
import type { CalendarBucket } from "@/core/domain/repositories/AdminCalendarRepository";
import {
  calendarDays,
  calendarFullDate,
  calendarMoney,
  calendarMonths,
  emptyCalendarSummary,
} from "@/core/utils/admin-calendar";

export function CalendarOverview({
  view,
  date,
  today,
  buckets,
  cash,
  onSelect,
}: {
  view: "month" | "year";
  date: string;
  today: string;
  buckets: CalendarBucket[];
  cash: boolean;
  onSelect: (date: string, view: "day" | "month") => void;
}) {
  const map = new Map(buckets.map((b) => [b.date, b]));
  const year = date.slice(0, 4);
  if (view === "year")
    return (
      <section
        aria-label={`Meses de ${year}`}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {calendarMonths.map((name, index) => {
          const key = `${year}-${String(index + 1).padStart(2, "0")}`;
          const bucket = map.get(key) || emptyCalendarSummary();
          const current = today.startsWith(key);
          return (
            <button
              key={key}
              onClick={() => onSelect(`${key}-01`, "month")}
              aria-label={`Abrir ${name} de ${year}, ${bucket.count} ${cash ? "recebimentos" : "agendamentos"}`}
              className={`min-h-44 cursor-pointer rounded-2xl border bg-[#151515] p-5 text-left transition-colors hover:border-[#D4AF37]/60 focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${current ? "border-[#D4AF37]/70" : "border-white/10"}`}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <strong>{name}</strong>
                {current && (
                  <span className="text-xs text-[#D4AF37]">Mês atual</span>
                )}
              </span>
              <strong className="mt-4 block text-2xl tabular-nums">
                {bucket.count}{" "}
                <span className="text-xs font-normal text-zinc-400">
                  {cash ? "recebimentos" : "agendamentos"}
                </span>
              </strong>
              <span className="mt-2 block text-sm text-zinc-300">
                {calendarMoney(
                  cash ? bucket.receivedCents : bucket.realizedCents,
                )}{" "}
                {cash ? "no caixa" : "em serviços concluídos"}
              </span>
              <span className="mt-4 block text-xs text-[#D4AF37]">
                Ver dias do mês →
              </span>
            </button>
          );
        })}
      </section>
    );
  return (
    <section
      className="rounded-2xl border border-white/10 bg-[#151515] sm:p-5"
      aria-label={`Dias de ${calendarMonths[Number(date.slice(5, 7)) - 1]} de ${year}`}
    >
      <div className="px-4 pb-4 pt-5 sm:px-0 sm:pt-0">
        <h2 className="font-semibold">Escolha um dia</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {cash
            ? "A contagem considera pagamentos confirmados no caixa em cada data."
            : "Selecione um dia para ver os atendimentos. Minutos reservados consideram agendados e concluídos, sem estimar capacidade."}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-zinc-400 sm:gap-2">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
          <span key={day} className="py-3">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
        {calendarDays(date).map((day, index) => {
          if (!day) return <div aria-hidden="true" key={`empty-${index}`} />;
          const bucket = map.get(day) || emptyCalendarSummary();
          const isToday = day === today,
            selected = day === date;
          return (
            <button
              key={day}
              onClick={() => onSelect(day, "day")}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${calendarFullDate(day)}${isToday ? ", hoje" : ""}${selected ? ", selecionado" : ""}, ${bucket.count} ${cash ? "recebimentos" : "agendamentos"}${!cash ? `, ${bucket.reservedMinutes} minutos reservados` : ""}`}
              className={`flex min-h-24 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-0.5 py-2 focus-visible:outline-2 focus-visible:outline-[#D4AF37] sm:min-h-28 sm:gap-2 sm:px-2 ${selected ? "border-[#D4AF37]/70 bg-[#D4AF37]/15" : "border-white/10 hover:bg-white/5"} ${isToday ? "ring-1 ring-inset ring-[#D4AF37]" : ""}`}
            >
              <strong className="text-sm sm:text-base">
                {Number(day.slice(8))}
              </strong>
              <span
                className={`text-[10px] sm:text-xs ${isToday ? "text-[#D4AF37]" : selected ? "text-zinc-200" : "text-zinc-400"}`}
              >
                {isToday ? "Hoje" : selected ? "Seleção" : "\u00a0"}
              </span>
              <span
                className={`text-xs tabular-nums ${bucket.count ? "text-[#D4AF37]" : "text-zinc-500"}`}
              >
                {bucket.count ? `${bucket.count} ${cash ? "pg." : "ag."}` : "—"}
              </span>
              {!cash && bucket.reservedMinutes > 0 && (
                <span className="hidden text-[10px] text-zinc-400 sm:block">
                  {bucket.reservedMinutes} min
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 px-4 py-4 text-xs text-zinc-400 sm:px-0 sm:pb-0">
        <span>Contorno dourado: hoje</span>
        <span>Fundo dourado: data selecionada</span>
      </div>
    </section>
  );
}
