'use client';

import {
  cancelAppointmentByClientAction,
  getAppointmentDetailsAction,
  rescheduleAppointmentAction,
} from '@/app/actions/appointment-actions';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Scissors,
  Trash2,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface AppointmentDetail {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  clientId: string | null;
  barberId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  barberName: string;
  barberSpecialty: string | null;
  barberImage: string | null;
  clientName: string;
}

interface AvailabilitySlot {
  time: string;
  dateTime: string | Date;
  available: boolean;
}

export function AppointmentDetailClient({ initialAppointment }: { initialAppointment: AppointmentDetail }) {
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentDetail>(initialAppointment);

  // Rescheduling state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [datesList] = useState<Date[]>(() =>
    Array.from({ length: 14 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() + i);
      return day;
    })
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Canceling state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchAppointmentDetails = async () => {
    try {
      const res = await getAppointmentDetailsAction(appointment.id);
      if (res.success && res.appointment) {
        setAppointment(res.appointment);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch slots whenever selectedDate or isRescheduling changes
  useEffect(() => {
    if (!isRescheduling || !appointment) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setRescheduleError(null);
      setSelectedSlot(null);
      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const res = await fetch(
          `/api/barbers/${appointment.barberId}/availability?date=${dateStr}&serviceId=${appointment.serviceId}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setSlots(data);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error(err);
        setRescheduleError('Erro ao carregar horários disponíveis.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isRescheduling, selectedDate, appointment]);

  const handleRescheduleSubmit = async () => {
    if (!appointment || !selectedSlot) return;
    setSubmittingReschedule(true);
    setRescheduleError(null);
    try {
      const res = await rescheduleAppointmentAction({
        appointmentId: appointment.id,
        newStartTimeStr:
          typeof selectedSlot.dateTime === 'string'
            ? selectedSlot.dateTime
            : selectedSlot.dateTime.toISOString(),
      });

      if (res.success && res.appointment) {
        setActionSuccessMessage('Agendamento reagendado com sucesso!');
        setIsRescheduling(false);
        await fetchAppointmentDetails();
        setTimeout(() => setActionSuccessMessage(null), 5000);
      } else {
        setRescheduleError(res.error || 'Erro ao reagendar. Tente outro horário.');
      }
    } catch (err) {
      console.error(err);
      setRescheduleError('Erro inesperado ao reagendar.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!appointment) return;
    setCanceling(true);
    try {
      const res = await cancelAppointmentByClientAction(appointment.id);
      if (res.success) {
        setActionSuccessMessage('Agendamento cancelado com sucesso.');
        setShowCancelConfirm(false);
        await fetchAppointmentDetails();
        setTimeout(() => setActionSuccessMessage(null), 5000);
      } else {
        alert(res.error || 'Não foi possível cancelar este agendamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao cancelar.');
    } finally {
      setCanceling(false);
    }
  };

  const apptDate = new Date(appointment.startTime);
  const now = new Date();
  const isFuture = apptDate > now;
  const isActive = (appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && isFuture;

  // Format Helpers
  const formattedDay = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(apptDate);

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(apptDate);

  const getStatusBadge = () => {
    if (appointment.status === 'CANCELED') {
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelado</span>
        </div>
      );
    }
    if (appointment.status === 'COMPLETED') {
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Concluído</span>
        </div>
      );
    }
    if (appointment.status === 'NO_SHOW') {
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Falta</span>
        </div>
      );
    }
    if (!isFuture) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-300">
          <Clock className="w-3.5 h-3.5" />
          <span>Aguardando atualização</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#22C55E]/10">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{appointment.status === 'PENDING' ? 'Agendado' : 'Confirmado'}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24 selection:bg-[#D4AF37] selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto min-h-16 flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/agenda')}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para agendamentos</span>
        </button>
        <span className="text-xs font-medium text-zinc-400">Sua reserva</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <div role="status" className="bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{actionSuccessMessage}</p>
          </div>
        )}

        {/* Header Title + Status */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#D4AF37]">
              Sua reserva
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
              Detalhes do agendamento
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">Confira as informações do seu horário.</p>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Rescheduling Panel (if active) */}
        {isRescheduling && (
          <div className="bg-[#151515] border-2 border-[#D4AF37]/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold text-white">Reagendar Dia e Horário</h3>
              </div>
              <button
                onClick={() => setIsRescheduling(false)}
                className="text-xs font-bold text-white/60 hover:text-white px-3 py-1 rounded-lg bg-white/5"
              >
                Cancelar
              </button>
            </div>

            {rescheduleError && (
              <div role="alert" className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-red-300 text-sm font-semibold">
                {rescheduleError}
              </div>
            )}

            {/* Date Selection Wheel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2.5">
                1. Escolha o novo dia
              </label>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {datesList.map((d, index) => {
                  const isSelected =
                    d.getFullYear() === selectedDate.getFullYear() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getDate() === selectedDate.getDate();

                  const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '');
                  const dayNum = d.getDate();
                  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', '');

                  return (
                    <button
                      key={index}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center justify-center min-w-[64px] py-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0D0D0D] font-extrabold shadow-lg shadow-[#D4AF37]/20 scale-105'
                          : 'bg-[#1C1C1C] border-white/10 text-white/80 hover:border-white/30'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-[#0D0D0D]/70' : 'text-white/40'}`}>
                        {dayName}
                      </span>
                      <span className="text-lg font-black my-0.5">{dayNum}</span>
                      <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-[#0D0D0D]/80' : 'text-white/60'}`}>
                        {monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2.5">
                2. Escolha o novo horário
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                </div>
              ) : !slots.some((slot) => slot.available) ? (
                <p className="text-xs text-white/50 bg-[#1C1C1C] p-4 rounded-xl text-center">
                  Nenhum horário disponível nesta data. Por favor, selecione outro dia.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {slots.map((slot, index) => {
                    if (!slot.available) return null;
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={index}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0D0D0D] shadow-md shadow-[#D4AF37]/20'
                            : 'bg-[#1C1C1C] border-white/10 text-white hover:border-[#D4AF37]/50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={!selectedSlot || submittingReschedule}
                onClick={handleRescheduleSubmit}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] font-extrabold text-sm shadow-xl hover:bg-[#E2BE4D] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
              >
                {submittingReschedule ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Reagendamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal / Sheet */}
        {showCancelConfirm && (
          <div className="bg-[#151515] border-2 border-[#EF4444]/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold">Cancelar Agendamento?</h3>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Tem certeza que deseja cancelar seu horário para <strong>{appointment.serviceName}</strong> com{' '}
              <strong>{appointment.barberName}</strong> em{' '}
              <strong>{formattedDay} às {formattedTime}</strong>?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                disabled={canceling}
                onClick={handleCancelSubmit}
                className="flex-1 py-3 px-5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-sm shadow-xl shadow-[#EF4444]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Sim, Cancelar Reserva</span>
              </button>
              <button
                disabled={canceling}
                onClick={() => setShowCancelConfirm(false)}
                className="py-3 px-6 rounded-2xl bg-[#1C1C1C] hover:bg-white/10 text-white/80 font-bold text-sm border border-white/10 transition-all"
              >
                Manter Agendamento
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <section aria-labelledby="resumo-reserva" className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]">
            <div className="border-b border-white/10 px-5 py-5 sm:px-7">
              <h2 id="resumo-reserva" className="text-base font-semibold text-white">Seu horário</h2>
              <p className="mt-1 text-sm text-zinc-400">Os detalhes da sua visita em um só lugar.</p>
            </div>
            <div className="px-5 sm:px-7">
              <div className="flex items-start gap-4 py-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-400">Data e horário</p>
                  <p className="mt-1 text-lg font-semibold leading-snug text-white first-letter:uppercase">{formattedDay}</p>
                  <p className="mt-1 text-base font-semibold text-[#E5C45B]">{formattedTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-white/10 py-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D4AF37]">
                  <Scissors className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-400">Serviço</p>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-base font-semibold text-white">{appointment.serviceName}</h3>
                    <span className="whitespace-nowrap text-base font-semibold text-[#E5C45B]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.servicePrice)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">Duração estimada: {appointment.serviceDurationMinutes} minutos</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-white/10 py-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-[#D4AF37]">
                  {appointment.barberImage ? (
                    <img src={appointment.barberImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-400">Profissional</p>
                  <h3 className="mt-1 text-base font-semibold text-white">{appointment.barberName}</h3>
                  {appointment.barberSpecialty && <p className="mt-1 text-sm text-zinc-400">Serviço mais realizado: {appointment.barberSpecialty}</p>}
                </div>
              </div>
            </div>
          </section>

          {(isActive && !isRescheduling && !showCancelConfirm) ? (
            <section aria-labelledby="acoes-reserva" className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
              <h2 id="acoes-reserva" className="text-base font-semibold text-white">Precisa fazer alterações?</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Escolha outro horário ou cancele sua reserva.</p>
              <div className="mt-5 flex flex-col gap-3">
                <button type="button" onClick={() => setIsRescheduling(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-semibold text-[#0D0D0D] transition-colors hover:bg-[#E2BE4D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Reagendar horário
                </button>
                <button type="button" onClick={() => setShowCancelConfirm(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-zinc-300 transition-colors hover:border-red-400/50 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Cancelar reserva
                </button>
              </div>
            </section>
          ) : !isActive ? (
            <section className="rounded-2xl border border-white/10 bg-[#151515] p-5 sm:p-6">
              <h2 className="text-base font-semibold text-white">Agende sua próxima visita</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Escolha o serviço e o horário que preferir.</p>
              <button type="button" onClick={() => router.push('/?action=agendar')} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-semibold text-[#0D0D0D] transition-colors hover:bg-[#E2BE4D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Novo agendamento
              </button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
