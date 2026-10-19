"use client";
import type {
  CalendarAppointment,
  CalendarContext,
} from "@/core/domain/repositories/AdminCalendarRepository";
import {
  calendarMoney,
  calendarAppointmentStatusLabels,
  calendarTime,
} from "@/core/utils/admin-calendar";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import { Banknote, CalendarCheck, ChevronRight, Clock3 } from "lucide-react";
import { useState } from "react";
import { CalendarAppointmentDialog } from "./CalendarAppointmentDialog";

export function CalendarDailyAgenda({
  appointments,
  context,
  filtered,
  onUpdated,
}: {
  appointments: CalendarAppointment[];
  context: CalendarContext;
  filtered: boolean;
  onUpdated?: () => void;
}) {
  const [selected, setSelected] = useState<CalendarAppointment | null>(null);
  const groups = new Map<
    string,
    { name: string; active: boolean; rows: CalendarAppointment[] }
  >();
  for (const row of appointments) {
    if (!groups.has(row.barberId))
      groups.set(row.barberId, {
        name: row.barberName,
        active: row.barberActive,
        rows: [],
      });
    groups.get(row.barberId)!.rows.push(row);
  }
  if (!appointments.length)
    return (
      <div className="rounded-2xl border border-white/10 bg-[#151515] px-5 py-14 text-center">
        <Clock3 aria-hidden="true" className="mx-auto size-8 text-[#D4AF37]" />
        <h2 className="mt-4 text-lg font-semibold">
          {context === "cash"
            ? "Nenhum recebimento confirmado"
            : "Nenhum agendamento encontrado"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
          {filtered
            ? "Nenhum registro corresponde aos filtros deste dia. Ajuste os filtros ou escolha outra data."
            : context === "cash"
              ? "Não há pagamentos atualmente confirmados no caixa nesta data."
              : "Não há reservas registradas nesta data. Escolha outro dia para consultar a agenda."}
        </p>
      </div>
    );
  return (
    <section
      aria-label={
        context === "cash"
          ? "Recebimentos por profissional"
          : "Agenda por profissional"
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {context === "cash"
            ? "Recebimentos por profissional"
            : "Agenda por profissional"}
        </h2>
        <p className="text-xs text-zinc-400">
          {context === "cash"
            ? "Ordenados pela confirmação no caixa"
            : "Horários em ordem cronológica"}{" "}
          · Brasília
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[...groups.entries()]
          .sort(([, a], [, b]) => a.name.localeCompare(b.name))
          .map(([id, group]) => (
            <section
              key={id}
              aria-label={`Agenda de ${group.name}`}
              className="min-w-0 rounded-2xl border border-white/10 bg-[#151515] p-4 sm:p-5"
            >
              <header className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{group.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    {group.active
                      ? "Profissional ativo"
                      : "Profissional inativo · histórico preservado"}
                  </p>
                </div>
                <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300">
                  {group.rows.length}{" "}
                  {context === "cash"
                    ? group.rows.length === 1
                      ? "pagamento"
                      : "pagamentos"
                    : group.rows.length === 1
                      ? "reserva"
                      : "reservas"}
                </span>
              </header>
              <ul className="space-y-3">
                {group.rows.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelected(a)}
                      className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#1C1C1C] p-4 text-left transition-colors hover:border-[#D4AF37]/50 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[#D4AF37]">
                          {context === "cash" && a.confirmedAt
                            ? `Caixa · ${calendarTime(a.confirmedAt)}`
                            : `${calendarTime(a.startTime)} – ${calendarTime(a.endTime)}`}
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-zinc-400"
                        />
                      </div>
                      <h4 className="mt-2 break-words text-base font-semibold">
                        {a.clientName}
                      </h4>
                      <p className="mt-1 text-sm text-zinc-300">
                        {a.serviceName} ·{" "}
                        {calendarMoney(
                          context === "cash" ? a.receivedCents : a.priceCents,
                        )}
                      </p>
                      {context === "cash" && (
                        <p className="mt-2 text-xs text-zinc-400">
                          Atendimento:{" "}
                          {getYYYYMMDD(a.startTime)
                            .split("-")
                            .reverse()
                            .join("/")}{" "}
                          · {calendarTime(a.startTime)}
                        </p>
                      )}
                      <div className="mt-3 space-y-2 text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <CalendarCheck
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {calendarAppointmentStatusLabels[
                            a.status as keyof typeof calendarAppointmentStatusLabels
                          ] || a.status}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${a.paymentStatus === "CONFIRMED" ? "text-emerald-300" : "text-[#D4AF37]"}`}
                        >
                          <Banknote aria-hidden="true" className="size-3.5" />
                          {a.paymentStatus === "CONFIRMED"
                            ? "Pagamento confirmado"
                            : a.paymentStatus === "REVERSED"
                              ? "Pagamento estornado"
                              : "Sem pagamento confirmado"}
                        </span>
                      </div>
                      <span className="mt-3 block text-xs text-zinc-400">
                        Ver detalhes do atendimento
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
      {selected && (
        <CalendarAppointmentDialog
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
    </section>
  );
}
