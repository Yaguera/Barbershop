"use client";

import { changeAppointmentStatusAction } from "@/app/actions/appointment-actions";
import {
  confirmPaymentReceiptAction,
  getCashRegisterDataAction,
  getReceptionAgendaAction,
} from "@/app/actions/reception-actions";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  Scissors,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AgendaAppointmentItem {
  id: string;
  barberId: string;
  barberName: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  origin: string;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  priceCents: number;
  isPaid: boolean;
  paymentStatus: "NOT_APPLICABLE" | "AWAITING_PAYMENT" | "PAID";
}

interface PendingPaymentItem {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string | null;
  startTime: string | Date;
  endTime: string | Date;
  priceCents: number;
  origin: string;
}

interface ConfirmedReceiptItem {
  id: string;
  appointmentId: string;
  amountCents: number;
  method: string;
  confirmedByName: string;
  confirmedAt: string | Date;
  clientName: string;
  serviceName: string;
  barberName: string;
}

interface AdminOperationsSectionProps {
  onOperationComplete?: () => void;
  defaultTab?: "APPOINTMENTS" | "PAYMENTS";
}

const formatBRLFromCents = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);

const formatTimeBR = (value: string | Date) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateShortBR = (value: string | Date) =>
  new Date(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  });

export function AdminOperationsSection({
  onOperationComplete,
  defaultTab = "APPOINTMENTS",
}: AdminOperationsSectionProps) {
  const [activeTab, setActiveTab] = useState<"APPOINTMENTS" | "PAYMENTS">(
    defaultTab,
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    getYYYYMMDD(new Date()),
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");

  const [appointments, setAppointments] = useState<AgendaAppointmentItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentItem[]>(
    [],
  );
  const [confirmedReceipts, setConfirmedReceipts] = useState<
    ConfirmedReceiptItem[]
  >([]);
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Payment method selection per appointmentId
  const [methodByAppointment, setMethodByAppointment] = useState<
    Record<string, "PIX" | "MONEY" | "CARD">
  >({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOperationalData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [agendaRes, cashRes] = await Promise.all([
        getReceptionAgendaAction(selectedDate, selectedBarberId),
        getCashRegisterDataAction(selectedDate, selectedBarberId),
      ]);

      if (agendaRes.success) {
        setAppointments(
          (agendaRes.appointments as unknown as AgendaAppointmentItem[]) || [],
        );
        if (agendaRes.barbers) {
          setBarbers(
            agendaRes.barbers.map((b) => ({ id: b.id, name: b.name })),
          );
        }
      } else {
        setErrorMsg(agendaRes.error || "Erro ao carregar agendamentos do dia.");
      }

      if (cashRes.success) {
        setPendingPayments(
          (cashRes.pending as unknown as PendingPaymentItem[]) || [],
        );
        setConfirmedReceipts(
          (cashRes.receiptsToday as unknown as ConfirmedReceiptItem[]) || [],
        );
      }
    } catch {
      setErrorMsg("Falha de conexão ao carregar as seções operacionais.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedBarberId]);

  useEffect(() => {
    void loadOperationalData();
  }, [loadOperationalData]);

  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    setSelectedDate(getYYYYMMDD(dt));
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: "COMPLETED" | "NO_SHOW" | "CANCELED",
  ) => {
    setProcessingId(`${appointmentId}:${newStatus}`);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const res = await changeAppointmentStatusAction({
        appointmentId,
        newStatus,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Não foi possível atualizar o agendamento.");
      } else {
        setFeedbackMsg(
          newStatus === "COMPLETED"
            ? "Agendamento marcado como concluído! Ele já está disponível na seção de Confirmar Pagamentos."
            : newStatus === "NO_SHOW"
              ? "Agendamento marcado como falta (Não compareceu)."
              : "Agendamento cancelado com sucesso.",
        );
        await loadOperationalData();
        onOperationComplete?.();
      }
    } catch {
      setErrorMsg("Erro ao atualizar status do agendamento.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmPayment = async (appointmentId: string) => {
    const method = methodByAppointment[appointmentId] || "PIX";
    setProcessingId(`${appointmentId}:PAY`);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const res = await confirmPaymentReceiptAction({
        appointmentId,
        method,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Não foi possível confirmar o pagamento.");
      } else {
        setFeedbackMsg("Pagamento confirmado com sucesso no caixa!");
        await loadOperationalData();
        onOperationComplete?.();
      }
    } catch {
      setErrorMsg("Erro de conexão ao confirmar pagamento.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === "PENDING",
  ).length;

  return (
    <section
      aria-label="Operações Rápidas do Administrador"
      className="rounded-xl border border-white/10 bg-[#141414] p-4 sm:p-6 shadow-xl space-y-5"
    >
      {/* Cabeçalho e Seletor das 2 Seções Operacionais */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
            Operação Direta no Painel Admin
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
            Controle de Atendimentos e Confirmação de Caixa
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Conclua agendamentos realizados na cadeira e confirme pagamentos
            recebidos diretamente pelo painel administrativo.
          </p>
        </div>

        {/* Abas das 2 Seções Específicas */}
        <div
          className="inline-flex rounded-lg border border-white/10 bg-[#1C1C1C] p-1 self-start lg:self-auto"
          role="tablist"
          aria-label="Seções operacionais do administrador"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "APPOINTMENTS"}
            onClick={() => setActiveTab("APPOINTMENTS")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "APPOINTMENTS"
                ? "bg-[#D4AF37] text-black font-bold"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>1. Concluir Agendamentos</span>
            {pendingAppointmentsCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  activeTab === "APPOINTMENTS"
                    ? "bg-black/20 text-black"
                    : "bg-[#D4AF37]/20 text-[#D4AF37]"
                }`}
              >
                {pendingAppointmentsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "PAYMENTS"}
            onClick={() => setActiveTab("PAYMENTS")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "PAYMENTS"
                ? "bg-[#D4AF37] text-black font-bold"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>2. Confirmar Pagamentos</span>
            {pendingPayments.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  activeTab === "PAYMENTS"
                    ? "bg-black/20 text-black"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {pendingPayments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Data e Profissional */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#1C1C1C] p-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent px-2 py-1 text-xs font-semibold text-white focus:outline-none [color-scheme:dark]"
              aria-label="Data da operação"
            />
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(getYYYYMMDD(new Date()))}
            className="rounded-lg border border-white/10 bg-[#1C1C1C] px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            Hoje
          </button>

          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1C1C1C] px-3 py-2 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            aria-label="Filtrar operação por profissional"
          >
            <option value="all">Todos os Barbeiros</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadOperationalData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1C1C] px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#D4AF37]" : ""}`}
          />
          <span>Atualizar fila</span>
        </button>
      </div>

      {/* Alertas de retorno */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Conteúdo da Aba Selecionada */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>Carregando registros operacionais...</span>
        </div>
      ) : activeTab === "APPOINTMENTS" ? (
        /* SEÇÃO 1: CONCLUIR AGENDAMENTOS */
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-[#101010] py-10 text-center text-xs text-zinc-400">
              Nenhum agendamento encontrado para a data e filtro selecionados.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-[#101010]">
              {appointments.map((apt) => {
                const isPending = apt.status === "PENDING";
                const isCompleted = apt.status === "COMPLETED";
                const isAwaitingPayment =
                  isCompleted && apt.paymentStatus === "AWAITING_PAYMENT";

                return (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-[#D4AF37]/15 px-2 py-0.5 font-bold text-[#D4AF37]">
                          <Clock className="w-3 h-3" />
                          {formatTimeBR(apt.startTime)}
                        </span>
                        <strong className="text-sm font-semibold text-white">
                          {apt.clientName}
                        </strong>
                        <span className="text-zinc-400">
                          · {apt.serviceName} ({formatBRLFromCents(apt.priceCents)})
                        </span>
                        <span className="text-zinc-500">
                          · Barbeiro: {apt.barberName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${
                            apt.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : apt.status === "PENDING"
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          <CalendarCheck className="w-3 h-3" />
                          {apt.status === "COMPLETED"
                            ? "Concluído"
                            : apt.status === "PENDING"
                              ? "Agendado (Pendente)"
                              : apt.status === "NO_SHOW"
                                ? "Falta"
                                : "Cancelado"}
                        </span>

                        {isCompleted && (
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${
                              apt.isPaid
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            <Banknote className="w-3 h-3" />
                            {apt.isPaid
                              ? "Pagamento Confirmado"
                              : "Aguardando Pagamento no Caixa"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação do Admin */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() =>
                              void handleStatusChange(apt.id, "COMPLETED")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                          >
                            {processingId === `${apt.id}:COMPLETED` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Concluir Atendimento
                          </button>

                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() =>
                              void handleStatusChange(apt.id, "NO_SHOW")
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            Falta
                          </button>

                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() =>
                              void handleStatusChange(apt.id, "CANCELED")
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </>
                      )}

                      {isAwaitingPayment && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("PAYMENTS")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/25 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          Confirmar Pagamento →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* SEÇÃO 2: CONFIRMAR PAGAMENTOS REALIZADOS NO CAIXA */
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Atendimentos Concluídos Aguardando Confirmação de Pagamento (
              {pendingPayments.length})
            </h3>

            {pendingPayments.length === 0 ? (
              <div className="rounded-lg border border-white/[0.06] bg-[#101010] py-8 text-center text-xs text-zinc-400">
                Todos os atendimentos concluídos já tiveram seu pagamento
                confirmado no caixa!
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-[#101010]">
                {pendingPayments.map((item) => {
                  const selectedMethod =
                    methodByAppointment[item.id] || "PIX";
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                            {formatDateShortBR(item.startTime)} ·{" "}
                            {formatTimeBR(item.startTime)}
                          </span>
                          <strong className="text-sm font-semibold text-white">
                            {item.clientName}
                          </strong>
                          <span className="text-zinc-300">
                            · {item.serviceName}
                          </span>
                          <span className="text-zinc-500">
                            · Barbeiro: {item.barberName}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#D4AF37]">
                          Valor a receber: {formatBRLFromCents(item.priceCents)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="inline-flex rounded-lg border border-white/10 bg-[#181818] p-0.5"
                          role="group"
                          aria-label="Forma de pagamento"
                        >
                          {(
                            [
                              { key: "PIX", label: "Pix", icon: QrCode },
                              {
                                key: "MONEY",
                                label: "Dinheiro",
                                icon: Banknote,
                              },
                              { key: "CARD", label: "Cartão", icon: CreditCard },
                            ] as const
                          ).map((m) => {
                            const Icon = m.icon;
                            const active = selectedMethod === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() =>
                                  setMethodByAppointment((prev) => ({
                                    ...prev,
                                    [item.id]: m.key,
                                  }))
                                }
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                  active
                                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{m.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={processingId !== null}
                          onClick={() => void handleConfirmPayment(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-2 text-xs font-bold text-black hover:bg-[#e2be46] disabled:opacity-50 cursor-pointer"
                        >
                          {processingId === `${item.id}:PAY` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Confirmar Pagamento
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagamentos já confirmados na data selecionada */}
          {confirmedReceipts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Pagamentos Confirmados nesta Data ({confirmedReceipts.length})
              </h3>
              <div className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.06] bg-[#101010] max-h-56 overflow-y-auto">
                {confirmedReceipts.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <strong className="text-white">{rec.clientName}</strong>
                      <span className="text-zinc-400">
                        {" "}
                        · {rec.serviceName} · {rec.barberName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {rec.method === "PIX"
                          ? "Pix"
                          : rec.method === "MONEY"
                            ? "Dinheiro"
                            : "Cartão"}
                      </span>
                      <strong className="font-bold text-emerald-400">
                        {formatBRLFromCents(rec.amountCents)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
