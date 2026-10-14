"use client";

import {
  createManualAppointmentAction,
  searchClientsForReceptionAction,
} from "@/app/actions/reception-actions";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import {
  parseBookingSlots,
  shiftBookingDate,
  validateNewContact,
} from "./manual-booking";
import type { BookingSlot, CustomerFields } from "./manual-booking";

interface BarberOption {
  id: string;
  name: string;
  workDays: number[];
}
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: "REGISTERED" | "CONTACT";
}
interface Props {
  barbers: BarberOption[];
  services: ServiceOption[];
  initialDate: string;
  initialBarberId?: string;
  onClose: () => void;
  onCreated: (date: string) => void;
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-white/15 bg-[#1C1C1C] px-3.5 py-3 text-base text-white placeholder:text-[#8C8C8C] transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 disabled:opacity-60";
const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515]";
const secondaryClass = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[#B3B3B3] transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`;
const primaryClass = `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#0D0D0D] transition-colors hover:bg-[#E2BE4D] disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-[#999] ${focusClass}`;
const steps = ["Cliente", "Horário", "Revisão"];
const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
const dateLabel = (date: string) =>
  date && !Number.isNaN(new Date(`${date}T12:00:00-03:00`).getTime())
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${date}T12:00:00-03:00`))
    : "Escolha uma data";
const timeLabel = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#D6D6D6]">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function ManualAppointmentDialog({
  barbers,
  services,
  initialDate,
  initialBarberId,
  onClose,
  onCreated,
}: Props) {
  const today = getYYYYMMDD(new Date());
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState<"WHATSAPP" | "WALK_IN">("WHATSAPP");
  const [mode, setMode] = useState<"NEW" | "SEARCH">("NEW");
  const [contact, setContact] = useState<CustomerFields>({
    name: "",
    phone: "",
    email: "",
  });
  const [showEmail, setShowEmail] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    ReturnType<typeof validateNewContact>
  >({});
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetry, setSearchRetry] = useState(0);
  const [date, setDate] = useState(initialDate >= today ? initialDate : today);
  const [barberId, setBarberId] = useState(
    barbers.some((b) => b.id === initialBarberId)
      ? initialBarberId!
      : barbers[0]?.id || "",
  );
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotRetry, setSlotRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [receipt, setReceipt] = useState<{
    id: string;
    startTime: string;
    endTime: string;
    price: number;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const submitLock = useRef(false);
  const dirty = Boolean(
    contact.name ||
    contact.phone ||
    contact.email ||
    customer ||
    query ||
    serviceId ||
    slot ||
    origin !== "WHATSAPP" ||
    date !== (initialDate >= today ? initialDate : today) ||
    barberId !== (initialBarberId || barbers[0]?.id || ""),
  );
  const barber = barbers.find((b) => b.id === barberId);
  const service = services.find((s) => s.id === serviceId);
  const customerName = mode === "SEARCH" ? customer?.name : contact.name.trim();
  const customerPhone =
    mode === "SEARCH" ? customer?.phone : contact.phone.trim();
  const freeSlots = slots.filter((s) => s.available);
  const hasSlotsContext = Boolean(barberId && serviceId && date >= today);
  const isWorkday = barber?.workDays.includes(
    new Date(`${date}T12:00:00-03:00`).getUTCDay(),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    headingRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [step, receipt]);

  useEffect(() => {
    let cancelled = false;
    setCustomers([]);
    setSearchError(null);
    setSearching(false);
    if (mode !== "SEARCH" || query.trim().length < 2 || customer || receipt)
      return;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const result = await searchClientsForReceptionAction(query.trim());
        if (cancelled) return;
        if (result.success) setCustomers(result.clients as Customer[]);
        else
          setSearchError(result.error || "Não foi possível buscar clientes.");
      } catch {
        if (!cancelled)
          setSearchError("Não foi possível buscar clientes. Tente novamente.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, query, customer, searchRetry, receipt]);

  useEffect(() => {
    if (step !== 1 || receipt || !hasSlotsContext) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setSlotsError(null);
    setSlots([]);
    const load = async () => {
      try {
        const params = new URLSearchParams({ date, serviceId });
        const response = await fetch(
          `/api/barbers/${encodeURIComponent(barberId)}/availability?${params}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok)
          throw new Error("Não foi possível consultar os horários.");
        const nextSlots = parseBookingSlots(await response.json(), date);
        if (!controller.signal.aborted) {
          setSlots(nextSlots);
          setSlot((current) =>
            nextSlots.some((s) => s.available && s.startTime === current)
              ? current
              : "",
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setSlot("");
          setSlotsError(
            "Não foi possível carregar os horários. Confira sua conexão e tente novamente.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [barberId, serviceId, date, step, hasSlotsContext, slotRetry, receipt]);

  const requestClose = () => {
    if (submitLock.current) return;
    if (!receipt && dirty) setDiscardPrompt(true);
    else onClose();
  };

  const keepFocusInDialog = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) {
      event.preventDefault();
      headingRef.current?.focus();
      return;
    }
    const active = document.activeElement;
    if (
      event.shiftKey &&
      (active === first || !controls.includes(active as HTMLElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const changeContact = (key: keyof CustomerFields, value: string) => {
    setContact((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError(null);
  };

  const validateCustomer = () => {
    if (mode === "SEARCH") {
      if (!customer) {
        setError("Selecione um cliente na busca ou cadastre um novo contato.");
        return false;
      }
    } else {
      const errors = validateNewContact(contact, origin);
      setFieldErrors(errors);
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        if (firstError === "email") setShowEmail(true);
        requestAnimationFrame(() =>
          document.getElementById(`booking-${firstError}`)?.focus(),
        );
        return false;
      }
    }
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitLock.current || receipt) return;
    setError(null);
    if (step === 0) {
      if (validateCustomer()) setStep(1);
      return;
    }
    if (
      !slot ||
      !freeSlots.some((s) => s.startTime === slot) ||
      loadingSlots ||
      slotsError
    ) {
      setError("Selecione um horário disponível para continuar.");
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!validateCustomer()) {
      setStep(0);
      return;
    }
    if (new Date(slot) <= new Date()) {
      setSlot("");
      setStep(1);
      setError("Esse horário já passou. Escolha outro horário.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      const customerPayload =
        mode === "SEARCH" && customer
          ? customer.type === "REGISTERED"
            ? { type: "REGISTERED" as const, clientId: customer.id }
            : { type: "EXISTING_CONTACT" as const, contactId: customer.id }
          : {
              type: "NEW_CONTACT" as const,
              name: contact.name.trim(),
              phone: contact.phone.trim() || undefined,
              email: contact.email.trim() || undefined,
            };
      const result = await createManualAppointmentAction({
        customer: customerPayload,
        origin,
        barberId,
        serviceId,
        startTimeStr: slot,
      });
      if (result.success) {
        setReceipt({
          id: result.appointment.id,
          startTime: new Date(result.appointment.startTime).toISOString(),
          endTime: new Date(result.appointment.endTime).toISOString(),
          price: result.appointment.priceCents / 100,
        });
        onCreated(date);
      } else {
        setError(result.error || "Não foi possível confirmar o agendamento.");
        if (result.status === 409) {
          setSlot("");
          setStep(1);
          setSlotRetry((n) => n + 1);
        }
      }
    } catch {
      setError(
        "Não foi possível confirmar a resposta. Confira a agenda antes de tentar novamente.",
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const summary = (review = false) => (
    <div
      className={
        review
          ? "space-y-5"
          : "space-y-5 rounded-2xl border border-white/10 bg-[#1C1C1C]/50 p-5"
      }
    >
      {!review && (
        <div>
          <p className="text-sm font-semibold text-white">Resumo da reserva</p>
          <p className="mt-1 text-xs leading-relaxed text-[#B3B3B3]">
            Suas escolhas aparecem aqui.
          </p>
        </div>
      )}
      <dl className="space-y-4 text-sm">
        {[
          ["Cliente", customerName || "Ainda não informado", 0],
          ["Origem", origin === "WHATSAPP" ? "WhatsApp" : "Presencial", 0],
          ["Profissional", barber?.name || "Selecione um profissional", 1],
          [
            "Serviço",
            service
              ? `${service.name} · ${service.durationMinutes} min`
              : "Selecione um serviço",
            1,
          ],
          ["Data", dateLabel(date), 1],
          [
            "Horário",
            receipt
              ? `${timeLabel(receipt.startTime)} – ${timeLabel(receipt.endTime)}`
              : slot && service
                ? `${timeLabel(slot)} – ${timeLabel(new Date(new Date(slot).getTime() + service.durationMinutes * 60000).toISOString())}`
                : "Escolha um horário",
            1,
          ],
        ].map(([label, value, target]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <dt className="text-xs text-[#B3B3B3]">{label}</dt>
              <dd className="mt-1 break-words font-medium text-white">
                {value}
              </dd>
            </div>
            {review && !receipt && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setStep(Number(target));
                  setError(null);
                }}
                className={`min-h-11 shrink-0 cursor-pointer rounded-lg px-2 text-xs font-medium text-[#D4AF37] hover:bg-white/5 ${focusClass}`}
                aria-label={`Editar ${label}`}
              >
                Editar
              </button>
            )}
          </div>
        ))}
      </dl>
      <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-sm text-[#B3B3B3]">Valor do serviço</p>
          <p className="mt-1 text-xs text-[#B3B3B3]">Pagamento no caixa</p>
        </div>
        <strong className="text-xl font-semibold text-[#D4AF37]">
          {receipt
            ? money(receipt.price)
            : service
              ? money(service.price)
              : "—"}
        </strong>
      </div>
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="manual-booking-title"
      aria-describedby="manual-booking-description"
      onKeyDown={keepFocusInDialog}
      style={{
        fontFamily: "var(--font-poppins, Poppins), system-ui, sans-serif",
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#151515] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:max-h-[90dvh] sm:rounded-3xl"
    >
      <div className="flex max-h-[calc(100dvh-1rem)] flex-col sm:max-h-[90dvh]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-[#D4AF37]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> RECEPÇÃO
            </div>
            <h2
              ref={headingRef}
              id="manual-booking-title"
              tabIndex={-1}
              className="text-xl font-semibold tracking-tight outline-none sm:text-2xl"
            >
              {receipt ? "Agendamento confirmado" : "Novo agendamento"}
            </h2>
            <p
              id="manual-booking-description"
              className="mt-1.5 text-sm leading-relaxed text-[#B3B3B3]"
            >
              {receipt
                ? "A reserva já está registrada na agenda do profissional."
                : "Reserve um horário para quem entrou em contato com a barbearia."}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={submitting}
            aria-label="Fechar agendamento"
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 text-[#B3B3B3] hover:bg-white/5 hover:text-white disabled:opacity-40 ${focusClass}`}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {discardPrompt && (
          <div
            role="alert"
            className="shrink-0 border-b border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-4 sm:px-8"
          >
            <p className="text-sm font-semibold">Descartar este agendamento?</p>
            <p className="mt-1 text-sm text-[#D6D6D6]">
              As escolhas ainda não foram salvas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                autoFocus
                type="button"
                className={secondaryClass}
                onClick={() => setDiscardPrompt(false)}
              >
                Continuar preenchendo
              </button>
              <button
                type="button"
                className={secondaryClass}
                onClick={onClose}
              >
                Descartar e fechar
              </button>
            </div>
          </div>
        )}

        {receipt ? (
          <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-8">
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-medium text-emerald-200">
                  Tudo certo, {customerName} está na agenda.
                </p>
                <p className="mt-1 text-sm text-[#D6D6D6]">
                  O pagamento será confirmado separadamente no caixa.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-xl">
              {summary(true)}
              <p className="mt-5 break-all text-xs text-[#B3B3B3]">
                Reserva: {receipt.id}
              </p>
              <button
                type="button"
                onClick={onClose}
                className={`${primaryClass} mt-6 w-full`}
              >
                Voltar à agenda <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <nav
              aria-label="Etapas do agendamento"
              className="shrink-0 px-5 pb-2 pt-5 sm:px-8"
            >
              <ol className="flex items-center gap-2 sm:gap-4">
                {steps.map((label, index) => (
                  <li key={label} className="flex flex-1 items-center gap-2">
                    <button
                      type="button"
                      aria-current={step === index ? "step" : undefined}
                      disabled={index >= step || submitting}
                      onClick={() => {
                        setStep(index);
                        setError(null);
                      }}
                      className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm ${focusClass} ${step === index ? "font-semibold text-white" : step > index ? "cursor-pointer text-[#D4AF37]" : "text-[#B3B3B3]"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${step === index ? "bg-[#D4AF37] text-[#0D0D0D]" : step > index ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "border border-white/20"}`}
                      >
                        {step > index ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={
                          step === index
                            ? ""
                            : "sr-only min-[360px]:not-sr-only"
                        }
                      >
                        {label}
                      </span>
                    </button>
                    {index < 2 && (
                      <span
                        aria-hidden="true"
                        className="hidden h-px flex-1 bg-white/10 sm:block"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <form
              onSubmit={submit}
              noValidate
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                ref={contentRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6"
              >
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                <div
                  className={
                    step === 2
                      ? "mx-auto max-w-xl"
                      : "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]"
                  }
                >
                  <fieldset disabled={submitting} className="min-w-0 space-y-6">
                    <legend className="sr-only">{steps[step]}</legend>
                    {step === 0 && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Quem vamos atender?
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#B3B3B3]">
                            Cadastre um contato ou encontre alguém que já está
                            cadastrado.
                          </p>
                        </div>
                        <fieldset>
                          <legend className="mb-2 text-sm font-medium text-[#D6D6D6]">
                            Como o cliente entrou em contato?
                          </legend>
                          <div className="grid grid-cols-2 gap-3">
                            {(["WHATSAPP", "WALK_IN"] as const).map((value) => (
                              <label
                                key={value}
                                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#D4AF37] ${origin === value ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/15 bg-[#1C1C1C] text-[#B3B3B3] hover:border-white/30"}`}
                              >
                                <input
                                  type="radio"
                                  name="booking-origin"
                                  value={value}
                                  checked={origin === value}
                                  onChange={() => {
                                    setOrigin(value);
                                    setFieldErrors({});
                                  }}
                                  className="sr-only"
                                />
                                {value === "WHATSAPP" ? (
                                  <MessageSquare className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                <span>
                                  {value === "WHATSAPP"
                                    ? "WhatsApp"
                                    : "Presencial"}
                                </span>
                                {origin === value && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <div
                          className="flex rounded-xl border border-white/10 bg-[#0D0D0D] p-1"
                          role="group"
                          aria-label="Identificação do cliente"
                        >
                          {(["NEW", "SEARCH"] as const).map((value) => (
                            <button
                              type="button"
                              key={value}
                              aria-pressed={mode === value}
                              onClick={() => {
                                setMode(value);
                                setError(null);
                                setFieldErrors({});
                              }}
                              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium ${focusClass} ${mode === value ? "bg-[#252525] text-white shadow-sm" : "text-[#B3B3B3] hover:text-white"}`}
                            >
                              {value === "NEW" ? (
                                <Plus className="h-4 w-4" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                              {value === "NEW"
                                ? "Novo contato"
                                : "Buscar cliente"}
                            </button>
                          ))}
                        </div>
                        {mode === "NEW" ? (
                          <div className="space-y-5">
                            <Field
                              id="booking-name"
                              label="Nome do cliente"
                              error={fieldErrors.name}
                            >
                              <input
                                id="booking-name"
                                value={contact.name}
                                onChange={(e) =>
                                  changeContact("name", e.target.value)
                                }
                                onBlur={() =>
                                  setFieldErrors((current) => ({
                                    ...current,
                                    name: validateNewContact(contact, origin)
                                      .name,
                                  }))
                                }
                                required
                                maxLength={120}
                                autoComplete="off"
                                placeholder="Nome e sobrenome"
                                aria-invalid={Boolean(fieldErrors.name)}
                                aria-describedby={
                                  fieldErrors.name
                                    ? "booking-name-error"
                                    : undefined
                                }
                                className={inputClass}
                              />
                            </Field>
                            <Field
                              id="booking-phone"
                              label={
                                origin === "WHATSAPP"
                                  ? "WhatsApp com DDD"
                                  : "Telefone (opcional)"
                              }
                              error={fieldErrors.phone}
                            >
                              <input
                                id="booking-phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="off"
                                required={origin === "WHATSAPP"}
                                value={contact.phone}
                                onChange={(e) =>
                                  changeContact("phone", e.target.value)
                                }
                                onBlur={() =>
                                  setFieldErrors((current) => ({
                                    ...current,
                                    phone: validateNewContact(contact, origin)
                                      .phone,
                                  }))
                                }
                                maxLength={30}
                                placeholder="(11) 99999-9999"
                                aria-invalid={Boolean(fieldErrors.phone)}
                                aria-describedby={
                                  fieldErrors.phone
                                    ? "booking-phone-error"
                                    : undefined
                                }
                                className={inputClass}
                              />
                            </Field>
                            {showEmail ? (
                              <Field
                                id="booking-email"
                                label="E-mail (opcional)"
                                error={fieldErrors.email}
                              >
                                <input
                                  id="booking-email"
                                  type="email"
                                  inputMode="email"
                                  autoComplete="off"
                                  value={contact.email}
                                  onChange={(e) =>
                                    changeContact("email", e.target.value)
                                  }
                                  onBlur={() =>
                                    setFieldErrors((current) => ({
                                      ...current,
                                      email: validateNewContact(contact, origin)
                                        .email,
                                    }))
                                  }
                                  maxLength={254}
                                  placeholder="cliente@exemplo.com"
                                  aria-invalid={Boolean(fieldErrors.email)}
                                  aria-describedby={
                                    fieldErrors.email
                                      ? "booking-email-error"
                                      : undefined
                                  }
                                  className={inputClass}
                                />
                              </Field>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowEmail(true)}
                                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg text-sm font-medium text-[#D4AF37] ${focusClass}`}
                              >
                                <Plus className="h-4 w-4" />
                                Adicionar e-mail (opcional)
                              </button>
                            )}
                            <p className="flex items-start gap-2 text-sm leading-relaxed text-[#B3B3B3]">
                              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                              Este contato não precisa criar uma conta para ser
                              agendado pela recepção.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {customer ? (
                              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                                    <User className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="break-words font-semibold">
                                      {customer.name}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-[#B3B3B3]">
                                      {customer.phone ||
                                        customer.email ||
                                        "Sem contato informado"}
                                    </p>
                                  </div>
                                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#D4AF37]" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCustomer(null)}
                                  className={`${secondaryClass} mt-4 w-full`}
                                >
                                  Escolher outro cliente
                                </button>
                              </div>
                            ) : (
                              <>
                                <Field
                                  id="booking-search"
                                  label="Nome, telefone ou e-mail"
                                >
                                  <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-[#B3B3B3]" />
                                    <input
                                      id="booking-search"
                                      value={query}
                                      onChange={(e) => setQuery(e.target.value)}
                                      autoComplete="off"
                                      placeholder="Digite pelo menos 2 caracteres"
                                      className={`${inputClass} pl-10`}
                                    />
                                  </div>
                                </Field>
                                <div aria-live="polite" aria-busy={searching}>
                                  {searching ? (
                                    <p className="flex items-center gap-2 py-4 text-sm text-[#B3B3B3]">
                                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                      Buscando clientes…
                                    </p>
                                  ) : searchError ? (
                                    <div
                                      role="alert"
                                      className="text-sm text-red-200"
                                    >
                                      <p>{searchError}</p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSearchRetry((n) => n + 1)
                                        }
                                        className={`${secondaryClass} mt-3`}
                                      >
                                        Tentar novamente
                                      </button>
                                    </div>
                                  ) : query.trim().length >= 2 &&
                                    customers.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm">
                                      <p className="text-[#B3B3B3]">
                                        Nenhum cliente encontrado.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => setMode("NEW")}
                                        className={`mt-2 min-h-11 cursor-pointer rounded-lg font-medium text-[#D4AF37] ${focusClass}`}
                                      >
                                        Cadastrar novo contato
                                      </button>
                                    </div>
                                  ) : (
                                    <ul className="max-h-56 space-y-2 overflow-y-auto">
                                      {customers.map((item) => (
                                        <li key={`${item.type}-${item.id}`}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCustomer(item);
                                              setError(null);
                                            }}
                                            className={`flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1C1C1C] p-3.5 text-left hover:border-[#D4AF37]/50 ${focusClass}`}
                                          >
                                            <span className="min-w-0">
                                              <span className="block break-words text-sm font-medium">
                                                {item.name}
                                              </span>
                                              <span className="mt-1 block break-words text-sm text-[#B3B3B3]">
                                                {item.phone ||
                                                  item.email ||
                                                  "Sem contato"}
                                              </span>
                                            </span>
                                            <span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-xs text-[#B3B3B3]">
                                              {item.type === "REGISTERED"
                                                ? "Com conta"
                                                : "Contato"}
                                            </span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Encontre o melhor horário
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#B3B3B3]">
                            Escolha o serviço para consultar a duração e as
                            vagas reais.
                          </p>
                        </div>
                        <Field id="booking-service" label="Serviço">
                          <select
                            id="booking-service"
                            value={serviceId}
                            onChange={(e) => {
                              setServiceId(e.target.value);
                              setSlot("");
                              setError(null);
                            }}
                            className={inputClass}
                          >
                            <option value="">Selecione um serviço</option>
                            {services.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} · {item.durationMinutes} min ·{" "}
                                {money(item.price)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field id="booking-barber" label="Profissional">
                          <select
                            id="booking-barber"
                            value={barberId}
                            onChange={(e) => {
                              setBarberId(e.target.value);
                              setSlot("");
                              setError(null);
                            }}
                            className={inputClass}
                          >
                            {barbers.length === 0 && (
                              <option value="">
                                Nenhum profissional disponível
                              </option>
                            )}
                            {barbers.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <div className="space-y-3">
                          <Field id="booking-date" label="Data do atendimento">
                            <input
                              id="booking-date"
                              type="date"
                              min={today}
                              value={date}
                              onChange={(e) => {
                                setDate(e.target.value);
                                setSlot("");
                                setError(null);
                              }}
                              className={`${inputClass} [color-scheme:dark]`}
                            />
                          </Field>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={date <= today || !date}
                              aria-label="Dia anterior"
                              onClick={() => {
                                setDate(shiftBookingDate(date, -1));
                                setSlot("");
                              }}
                              className={`${secondaryClass} px-3`}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            {[today, shiftBookingDate(today, 1)].map(
                              (value, index) => (
                                <button
                                  key={value}
                                  type="button"
                                  aria-pressed={date === value}
                                  onClick={() => {
                                    setDate(value);
                                    setSlot("");
                                    setError(null);
                                  }}
                                  className={`${secondaryClass} flex-1 ${date === value ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]" : ""}`}
                                >
                                  {index === 0 ? "Hoje" : "Amanhã"}
                                </button>
                              ),
                            )}
                            <button
                              type="button"
                              disabled={!date}
                              aria-label="Próximo dia"
                              onClick={() => {
                                setDate(shiftBookingDate(date, 1));
                                setSlot("");
                              }}
                              className={`${secondaryClass} px-3`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div aria-busy={loadingSlots}>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-medium">
                              Horários disponíveis
                            </h4>
                            {hasSlotsContext &&
                              !loadingSlots &&
                              !slotsError && (
                                <span className="text-xs text-[#B3B3B3]">
                                  {freeSlots.length}{" "}
                                  {freeSlots.length === 1
                                    ? "horário livre"
                                    : "horários livres"}
                                </span>
                              )}
                          </div>
                          {!hasSlotsContext ? (
                            <p className="rounded-xl border border-dashed border-white/15 p-5 text-sm leading-relaxed text-[#B3B3B3]">
                              Escolha serviço, profissional e data para ver os
                              horários.
                            </p>
                          ) : loadingSlots ? (
                            <div role="status">
                              <p className="mb-3 flex items-center gap-2 text-sm text-[#B3B3B3]">
                                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                                Consultando disponibilidade…
                              </p>
                              <div
                                aria-hidden="true"
                                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                              >
                                {Array.from({ length: 8 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-11 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : slotsError ? (
                            <div
                              role="alert"
                              className="rounded-xl border border-red-400/20 bg-red-400/5 p-4"
                            >
                              <p className="text-sm leading-relaxed text-red-200">
                                {slotsError}
                              </p>
                              <button
                                type="button"
                                onClick={() => setSlotRetry((n) => n + 1)}
                                className={`${secondaryClass} mt-3`}
                              >
                                Tentar novamente
                              </button>
                            </div>
                          ) : freeSlots.length === 0 ? (
                            <div
                              role="status"
                              className="rounded-xl border border-white/10 bg-[#1C1C1C] p-5"
                            >
                              <CalendarDays className="mb-3 h-5 w-5 text-[#D4AF37]" />
                              <p className="text-sm font-medium">
                                {isWorkday
                                  ? "Sem horários livres nesta data"
                                  : "O profissional não atende neste dia"}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-[#B3B3B3]">
                                Escolha outra data ou consulte outro
                                profissional.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setDate(shiftBookingDate(date, 1));
                                  setSlot("");
                                }}
                                className={`${secondaryClass} mt-4`}
                              >
                                Ver próximo dia{" "}
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {[
                                { name: "Manhã", from: 0, to: 12 },
                                { name: "Tarde", from: 12, to: 18 },
                                { name: "Noite", from: 18, to: 24 },
                              ].map((group) => {
                                const times = freeSlots.filter((item) => {
                                  const hour = Number(item.label.split(":")[0]);
                                  return hour >= group.from && hour < group.to;
                                });
                                return (
                                  times.length > 0 && (
                                    <fieldset key={group.name}>
                                      <legend className="mb-2 text-xs font-medium text-[#B3B3B3]">
                                        {group.name}
                                      </legend>
                                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {times.map((item) => (
                                          <label
                                            key={item.startTime}
                                            className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-[#D4AF37] ${slot === item.startTime ? "border-[#D4AF37] bg-[#D4AF37] text-[#0D0D0D]" : "border-white/15 bg-[#1C1C1C] text-white hover:border-[#D4AF37]/60"}`}
                                          >
                                            <input
                                              type="radio"
                                              name="booking-time"
                                              value={item.startTime}
                                              checked={slot === item.startTime}
                                              onChange={() => {
                                                setSlot(item.startTime);
                                                setError(null);
                                              }}
                                              className="sr-only"
                                            />
                                            {item.label}
                                            {slot === item.startTime && (
                                              <Check className="h-3.5 w-3.5" />
                                            )}
                                          </label>
                                        ))}
                                      </div>
                                    </fieldset>
                                  )
                                );
                              })}
                              <p className="text-xs leading-relaxed text-[#B3B3B3]">
                                Horários de Brasília. A disponibilidade será
                                conferida novamente ao confirmar.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold">
                            Confira antes de confirmar
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#B3B3B3]">
                            A reserva só será criada ao confirmar abaixo.
                          </p>
                        </div>
                        {summary(true)}
                        {customerPhone && (
                          <p className="break-words text-sm text-[#B3B3B3]">
                            Contato do cliente:{" "}
                            <span className="text-white">{customerPhone}</span>
                          </p>
                        )}
                        <div className="flex gap-3 rounded-xl border border-white/10 bg-[#1C1C1C] p-4 text-sm leading-relaxed text-[#B3B3B3]">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                          <p>
                            Agendar não confirma pagamento. O recebimento será
                            registrado separadamente no caixa.
                          </p>
                        </div>
                      </>
                    )}
                  </fieldset>
                  {step < 2 && (
                    <aside
                      className="hidden lg:block"
                      aria-label="Resumo do agendamento"
                    >
                      {summary()}
                      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#B3B3B3]">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                        Nenhum horário é reservado antes da confirmação.
                      </p>
                    </aside>
                  )}
                </div>
              </div>
              <footer className="shrink-0 border-t border-white/10 bg-[#121212] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#B3B3B3]">
                      {step === 2
                        ? "Total do agendamento"
                        : `Etapa ${step + 1} de 3`}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {service ? (
                        <>
                          {money(service.price)}{" "}
                          <span className="font-normal text-[#B3B3B3]">
                            · {service.durationMinutes} min
                          </span>
                        </>
                      ) : (
                        steps[step]
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        if (step > 0) {
                          setStep(step - 1);
                          setError(null);
                        } else requestClose();
                      }}
                      className={secondaryClass}
                    >
                      {step > 0 && <ArrowLeft className="h-4 w-4" />}
                      {step === 0 ? "Cancelar" : "Voltar"}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        (step > 0 &&
                          (!slot || loadingSlots || Boolean(slotsError)))
                      }
                      className={primaryClass}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                          Confirmando…
                        </>
                      ) : (
                        <>
                          {step === 2
                            ? "Confirmar agendamento"
                            : step === 1
                              ? "Revisar agendamento"
                              : "Escolher horário"}
                          {step < 2 && <ArrowRight className="h-4 w-4" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </footer>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
