"use client";
import type { CalendarAppointment } from "@/core/domain/repositories/AdminCalendarRepository";
import {
  calendarFullDate,
  calendarMoney,
  calendarAppointmentStatusLabels,
  calendarTime,
} from "@/core/utils/admin-calendar";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function CalendarAppointmentDialog({
  appointment: a,
  onClose,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const origins: Record<string, string> = {
    ONLINE: "Plataforma",
    WHATSAPP: "WhatsApp",
    WALK_IN: "Presencial",
  };
  const methods: Record<string, string> = {
    MONEY: "Dinheiro",
    PIX: "Pix",
    CARD: "Cartão",
  };
  return (
    <dialog
      ref={dialog}
      aria-labelledby="calendar-appointment-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#151515] p-5 text-white shadow-2xl backdrop:bg-black/75 sm:p-7"
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="text-xs text-[#D4AF37]">Detalhes do atendimento</p>
          <h2
            id="calendar-appointment-title"
            className="mt-2 break-words text-xl font-semibold"
          >
            {a.clientName}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {a.clientType === "CONTACT"
              ? "Contato cadastrado pela recepção"
              : "Cliente cadastrado"}
          </p>
        </div>
        <button
          autoFocus
          aria-label="Fechar atendimento"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <X className="size-5" />
        </button>
      </header>
      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-zinc-400">Serviço e profissional</dt>
          <dd className="mt-1">
            {a.serviceName} · {a.barberName}
            {!a.barberActive && " (inativo)"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-400">Data do atendimento · Brasília</dt>
          <dd className="mt-1">
            {calendarFullDate(getYYYYMMDD(a.startTime))}
            <br />
            {calendarTime(a.startTime)} até {calendarTime(a.endTime)}
            {getYYYYMMDD(a.endTime) !== getYYYYMMDD(a.startTime) &&
              ` de ${getYYYYMMDD(a.endTime).split("-").reverse().join("/")}`}
          </dd>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-400">Situação do atendimento</dt>
            <dd className="mt-1">
              {calendarAppointmentStatusLabels[
                a.status as keyof typeof calendarAppointmentStatusLabels
              ] || a.status}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">Origem da reserva</dt>
            <dd className="mt-1">{origins[a.origin] || a.origin}</dd>
          </div>
        </div>
      </dl>
      <section className="mt-5 rounded-xl border border-white/10 bg-[#1C1C1C] p-4">
        <h3 className="font-semibold">Pagamento no caixa</h3>
        <p
          className={`mt-2 text-sm ${a.paymentStatus === "CONFIRMED" ? "text-emerald-300" : "text-[#D4AF37]"}`}
        >
          {a.paymentStatus === "CONFIRMED"
            ? "Pagamento confirmado"
            : a.paymentStatus === "REVERSED"
              ? "Pagamento estornado · sem confirmação vigente"
              : "Sem pagamento confirmado"}
        </p>
        {a.confirmedAt && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {calendarMoney(a.receivedCents)} ·{" "}
            {methods[a.paymentMethod || ""] || "Forma não informada"}
            <br />
            {new Date(a.confirmedAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            · Brasília
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Concluir o atendimento não confirma pagamento. A recepção registra o
          recebimento no caixa.
        </p>
      </section>
      <section className="mt-5 text-sm">
        <h3 className="font-semibold">Valor e divisão do serviço</h3>
        <p className="mt-2">
          Serviço: <strong>{calendarMoney(a.priceCents)}</strong>
        </p>
        <p className="mt-1 text-zinc-300">
          Barbeiro: {calendarMoney(a.commissionCents)} (
          {(a.priceCents
            ? (a.commissionCents / a.priceCents) * 100
            : 0
          ).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
          %)
          <br />
          Barbearia: {calendarMoney(a.priceCents - a.commissionCents)}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Divisão preservada do agendamento. Comissão calculada não é repasse
          pago; despesas não incluídas.
        </p>
      </section>
      <button
        onClick={onClose}
        className="mt-6 min-h-11 w-full rounded-xl border border-white/15 px-4 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
      >
        Voltar à agenda
      </button>
    </dialog>
  );
}
