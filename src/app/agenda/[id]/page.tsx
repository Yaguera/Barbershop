'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  Check,
  ChevronRight,
  Loader2,
  CalendarClock
} from 'lucide-react';
import {
  getAppointmentDetailsAction,
  cancelAppointmentByClientAction,
  rescheduleAppointmentAction,
} from '@/app/actions/appointment-actions';

interface AppointmentDetail {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  barberName: string;
  barberSpecialty: string;
  barberImage: string | null;
  clientName: string;
}

interface AvailabilitySlot {
  time: string;
  dateTime: string | Date;
  available: boolean;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rescheduling state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [datesList, setDatesList] = useState<Date[]>([]);
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

  useEffect(() => {
    // Generate next 14 days for date picker
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    setDatesList(days);
    setSelectedDate(days[0]);
  }, []);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAppointmentDetailsAction(appointmentId);
      if (res.success && res.appointment) {
        setAppointment(res.appointment);
      } else {
        setError(res.error || 'Erro ao buscar detalhes do agendamento.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao carregar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

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
        newStartTimeStr: typeof selectedSlot.dateTime === 'string'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-sm text-white/60 font-medium">Carregando detalhes do agendamento...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mb-4 border border-[#EF4444]/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
        <p className="text-sm text-white/60 mb-6 max-w-md">{error || 'Agendamento não encontrado no sistema.'}</p>
        <button
          onClick={() => router.push('/agenda')}
          className="px-6 py-3 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] font-bold text-sm shadow-xl hover:bg-[#E2BE4D] transition-all"
        >
          Voltar para meus agendamentos
        </button>
      </div>
    );
  }

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
    if (appointment.status === 'COMPLETED' || (!isFuture && appointment.status !== 'CANCELED')) {
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
          <span>Ausente</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#22C55E]/10">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Confirmado</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24 selection:bg-[#D4AF37] selection:text-black">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/agenda')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para agendamentos</span>
        </button>
        <span className="text-xs uppercase font-bold text-white/40 tracking-widest">Reserva VIP</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Success Alert Banner */}
        {actionSuccessMessage && (
          <div className="bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{actionSuccessMessage}</p>
          </div>
        )}

        {/* Header Title + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <span className="text-[11px] font-black tracking-widest uppercase text-[#D4AF37]">
              GERENCIAR RESERVA
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Detalhes do Agendamento
            </h1>
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
              <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-xs font-semibold">
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
              ) : slots.length === 0 ? (
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

        {/* Date & Time Card */}
        <div className="bg-[#151515] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
            <Calendar className="w-4 h-4" />
            <span>Data e Horário</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-white capitalize">{formattedDay}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#1C1C1C] border border-white/10 px-4 py-2 rounded-2xl self-start sm:self-auto">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-lg font-black text-[#D4AF37]">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-[#151515] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
            <Scissors className="w-4 h-4" />
            <span>Serviço Selecionado</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{appointment.serviceName}</h3>
              <p className="text-xs text-white/60 flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Duração estimada: {appointment.serviceDurationMinutes} minutos</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/50 font-medium block">Valor</span>
              <span className="text-xl sm:text-2xl font-black text-[#D4AF37]">
                R$ {appointment.servicePrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Barber Profile Card */}
        <div className="bg-[#151515] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
            <UserIcon className="w-4 h-4" />
            <span>Profissional Responsável</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-lg overflow-hidden flex-shrink-0 shadow-lg">
              {appointment.barberImage ? (
                <img src={appointment.barberImage} alt={appointment.barberName} className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-6 h-6 text-[#D4AF37]" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{appointment.barberName}</h4>
              <p className="text-xs text-[#D4AF37] font-semibold tracking-wide">{appointment.barberSpecialty}</p>
            </div>
          </div>
        </div>

        {/* Actions section for Active & Future Appointments */}
        {isActive && !isRescheduling && !showCancelConfirm && (
          <div className="pt-2 space-y-3">
            <button
              onClick={() => setIsRescheduling(true)}
              className="w-full py-4 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D] font-extrabold text-sm shadow-xl shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01]"
            >
              <CalendarClock className="w-5 h-5" />
              <span>Editar Dia e Horário</span>
            </button>

            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#151515] hover:bg-[#EF4444]/15 border border-white/10 hover:border-[#EF4444]/40 text-white/80 hover:text-[#EF4444] font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancelar Reserva</span>
            </button>
          </div>
        )}

        {/* If completed/past or canceled, show action to book again */}
        {(!isActive || appointment.status === 'CANCELED') && (
          <div className="pt-2">
            <button
              onClick={() => router.push('/?action=agendar')}
              className="w-full py-4 px-6 rounded-2xl bg-[#1C1C1C] hover:bg-[#D4AF37]/15 border border-white/15 hover:border-[#D4AF37]/40 text-white hover:text-[#D4AF37] font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Realizar Novo Agendamento</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
