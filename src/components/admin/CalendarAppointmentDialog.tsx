"use client";
import { changeAppointmentStatusAction } from "@/app/actions/appointment-actions";
import { confirmPaymentReceiptAction } from "@/app/actions/reception-actions";
import type { CalendarAppointment } from "@/core/domain/repositories/AdminCalendarRepository";
import {
  calendarAppointmentStatusLabels,
  calendarFullDate,
  calendarMoney,
  calendarTime,
} from "@/core/utils/admin-calendar";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CalendarAppointmentDialog({
  appointment: a,
  onClose,
  onUpdated,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [currentStatus, setCurrentStatus] = useState(a.status);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(
    a.paymentStatus,
  );
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<
    string | null
  >(a.paymentMethod);
  const [currentConfirmedAt, setCurrentConfirmedAt] = useState<string | null>(
    a.confirmedAt,
  );
  const [selectedMethod, setSelectedMethod] = useState<
    "PIX" | "MONEY" | "CARD"
  >("PIX");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleStatusChange = async (
    newStatus: "COMPLETED" | "NO_SHOW" | "CANCELED",
  ) => {
    setSubmittingAction(newStatus);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const res = await changeAppointmentStatusAction({
        appointmentId: a.id,
        newStatus,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Não foi possível atualizar o agendamento.");
      } else {
        setCurrentStatus(newStatus);
        setFeedbackMsg(
          newStatus === "COMPLETED"
            ? "Agendamento marcado como concluído! Agora você já pode confirmar o pagamento abaixo."
            : newStatus === "NO_SHOW"
              ? "Agendamento marcado como falta (Não compareceu)."
              : "Agendamento cancelado com sucesso.",
        );
        onUpdated?.();
      }
    } catch {
      setErrorMsg("Erro de conexão ao atualizar status do agendamento.");
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleConfirmPayment = async () => {
    setSubmittingAction("PAYMENT");
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const res = await confirmPaymentReceiptAction({
        appointmentId: a.id,
        method: selectedMethod,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Não foi possível confirmar o pagamento.");
      } else {
        setCurrentPaymentStatus("CONFIRMED");
        setCurrentPaymentMethod(selectedMethod);
        setCurrentConfirmedAt(new Date().toISOString());
        setFeedbackMsg("Pagamento confirmado no caixa com sucesso!");
        onUpdated?.();
      }
    } catch {
      setErrorMsg("Erro de conexão ao confirmar pagamento.");
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="calendar-appointment-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
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
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-[#151515] p-0 text-white shadow-2xl backdrop:bg-black/75 backdrop:cursor-pointer"
    >
      <div
        className="p-5 sm:p-7"
        onClick={(event) => event.stopPropagation()}
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
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </header>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {feedbackMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

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
              <dd className="mt-1 font-medium text-white">
                {calendarAppointmentStatusLabels[
                  currentStatus as keyof typeof calendarAppointmentStatusLabels
                ] || currentStatus}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">Origem da reserva</dt>
              <dd className="mt-1">{origins[a.origin] || a.origin}</dd>
            </div>
          </div>
        </dl>

        {/* Seção Operacional Admin 1: Concluir ou Atualizar Agendamento */}
        {currentStatus === "PENDING" && (
          <section className="mt-5 rounded-xl border border-[#D4AF37]/30 bg-[#1C1C1C] p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Ação Administrativa · Agendamento
              </span>
              <h3 className="text-sm font-semibold text-white mt-0.5">
                Atualizar situação deste agendamento
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Marque como concluído assim que o serviço for realizado na
                cadeira para liberar o registro de pagamento no caixa.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleStatusChange("COMPLETED")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
              >
                {submittingAction === "COMPLETED" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Marcar como Concluído
              </button>
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleStatusChange("NO_SHOW")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {submittingAction === "NO_SHOW" && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Marcar Falta
              </button>
              <button
                type="button"
                disabled={submittingAction !== null}
                onClick={() => handleStatusChange("CANCELED")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                {submittingAction === "CANCELED" && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Cancelar Reserva
              </button>
            </div>
          </section>
        )}

        {/* Seção Operacional Admin 2: Pagamento no Caixa */}
        <section className="mt-5 rounded-xl border border-white/10 bg-[#1C1C1C] p-4 space-y-3">
          <div>
            <h3 className="font-semibold">Pagamento no caixa</h3>
            <p
              className={`mt-1.5 text-sm font-medium ${
                currentPaymentStatus === "CONFIRMED"
                  ? "text-emerald-300"
                  : "text-[#D4AF37]"
              }`}
            >
              {currentPaymentStatus === "CONFIRMED"
                ? "Pagamento confirmado"
                : currentPaymentStatus === "REVERSED"
                  ? "Pagamento estornado · sem confirmação vigente"
                  : "Sem pagamento confirmado"}
            </p>
          </div>

          {currentConfirmedAt && currentPaymentStatus === "CONFIRMED" && (
            <p className="text-sm leading-relaxed text-zinc-300">
              {calendarMoney(a.receivedCents || a.priceCents)} ·{" "}
              {methods[currentPaymentMethod || ""] || "Forma não informada"}
              <br />
              {new Date(currentConfirmedAt).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              · Brasília
            </p>
          )}

          {currentStatus === "COMPLETED" &&
            currentPaymentStatus !== "CONFIRMED" && (
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Ação Administrativa · Caixa
                  </span>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Selecione a forma de pagamento recebida ({calendarMoney(a.priceCents)}) para dar baixa imediata no caixa:
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "PIX", label: "Pix", icon: QrCode },
                      { key: "MONEY", label: "Dinheiro", icon: Banknote },
                      { key: "CARD", label: "Cartão", icon: CreditCard },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = selectedMethod === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedMethod(item.key)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                            : "border-white/10 bg-[#141414] text-zinc-300 hover:border-white/25"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={handleConfirmPayment}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#e3be42] disabled:opacity-50 cursor-pointer"
                >
                  {submittingAction === "PAYMENT" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Confirmar Pagamento Realizado ({calendarMoney(a.priceCents)})
                </button>
              </div>
            )}
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
        </section>

        <button
          onClick={onClose}
          className="mt-6 min-h-11 w-full rounded-xl border border-white/15 px-4 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#D4AF37] cursor-pointer"
        >
          Voltar à agenda
        </button>
      </div>
    </dialog>
  );
}

