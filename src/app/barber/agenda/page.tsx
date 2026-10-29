'use client';

import {
  changeAppointmentStatusAction,
  getBarberAppointmentsAction,
  getBarberMonthScheduleAction,
} from '@/app/actions/appointment-actions';
import { BarberNavbar } from '@/components/barber/BarberNavbar';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  RefreshCw,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarberAppointment {
  id: string;
  status: string;
  startTime: string | Date;
  serviceName: string;
  servicePrice: number;
  clientName: string;
  clientEmail: string;
  clientImage: string | null;
}

type ConfirmActionType = 'EARLY_COMPLETE' | 'CANCEL' | 'NO_SHOW';

interface ConfirmActionState {
  type: ConfirmActionType;
  appointment: BarberAppointment;
}

type StatusFilterType = 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELED_OR_NO_SHOW';

export default function BarberAgendaPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
  const [monthOccupancyMap, setMonthOccupancyMap] = useState<Record<string, number>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  const queueReqIdRef = useRef(0);
  const monthReqIdRef = useRef(0);

  const loadQueue = useCallback(async (dateToLoad = selectedDate) => {
    const reqId = ++queueReqIdRef.current;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const dateStr = getYYYYMMDD(dateToLoad);
      const result = await getBarberAppointmentsAction(dateStr);

      if (reqId !== queueReqIdRef.current) return;

      if (result.success && result.appointments) {
        setAppointments(result.appointments as BarberAppointment[]);
        if (result.barberId) {
          setBarberProfileId(result.barberId);
        }
      } else {
        setErrorMsg(result.error || 'Erro ao carregar fila de atendimentos.');
      }
    } catch (error) {
      if (reqId !== queueReqIdRef.current) return;
      console.error('Erro ao carregar fila do dia:', error);
      setErrorMsg('Erro de comunicação ao carregar a agenda.');
    } finally {
      if (reqId === queueReqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedDate]);

  const loadMonthOccupancy = useCallback(async (monthDate = currentMonthDate) => {
    const reqId = ++monthReqIdRef.current;
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const result = await getBarberMonthScheduleAction(year, month, barberProfileId || undefined);

      if (reqId !== monthReqIdRef.current) return;

      if (result.success && result.occupancy) {
        const map: Record<string, number> = {};
        result.occupancy.forEach((item) => {
          map[item.date] = item.count;
        });
        setMonthOccupancyMap(map);
      }
    } catch (error) {
      if (reqId !== monthReqIdRef.current) return;
      console.error('Erro ao carregar ocupação mensal:', error);
    }
  }, [currentMonthDate, barberProfileId]);

  useEffect(() => {
    loadQueue(selectedDate);
  }, [selectedDate, loadQueue]);

  useEffect(() => {
    loadMonthOccupancy(currentMonthDate);
  }, [currentMonthDate, barberProfileId, loadMonthOccupancy]);

  // Tecla Escape para fechar modal de confirmação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmAction && !isSubmitting) {
        setConfirmAction(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmAction, isSubmitting]);

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setUpdatingId(appointmentId);
    setErrorMsg(null);

    try {
      const result = await changeAppointmentStatusAction({
        appointmentId,
        newStatus,
      });

      if (result.success) {
        await Promise.all([loadQueue(selectedDate), loadMonthOccupancy(currentMonthDate)]);
      } else {
        setErrorMsg(result.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do atendimento:', error);
      setErrorMsg('Erro de comunicação ao atualizar o atendimento.');
    } finally {
      setIsSubmitting(false);
      setUpdatingId(null);
    }
  };

  const handleRequestComplete = (app: BarberAppointment) => {
    if (isSubmitting) return;
    const start = new Date(app.startTime);
    const now = new Date();

    if (now < start) {
      setConfirmAction({ type: 'EARLY_COMPLETE', appointment: app });
    } else {
      handleStatusChange(app.id, 'COMPLETED');
    }
  };

  const handleRequestNoShow = (app: BarberAppointment) => {
    if (isSubmitting) return;
    setConfirmAction({ type: 'NO_SHOW', appointment: app });
  };

  const handleRequestCancel = (app: BarberAppointment) => {
    if (isSubmitting) return;
    setConfirmAction({ type: 'CANCEL', appointment: app });
  };

  const handleExecuteConfirmedAction = () => {
    if (!confirmAction || isSubmitting) return;
    const targetId = confirmAction.appointment.id;
    const actionType = confirmAction.type;
    setConfirmAction(null);

    if (actionType === 'EARLY_COMPLETE') {
      handleStatusChange(targetId, 'COMPLETED');
    } else if (actionType === 'NO_SHOW') {
      handleStatusChange(targetId, 'NO_SHOW');
    } else if (actionType === 'CANCEL') {
      handleStatusChange(targetId, 'CANCELED');
    }
  };

  // Navegação de dias
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Navegação de meses
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const formatTime = (d: string | Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(d));
  };

  const formatSelectedDateFull = (d: Date) => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
            Agendado
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
            Concluído
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            Cancelado
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/40">
            Falta
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-white/10 text-white/70">
            {status}
          </span>
        );
    }
  };

  // Calendário
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);

    let startingDayIndex = firstDay.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid: { day: number; date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      grid.push({
        day: dayNum,
        date: new Date(year, month - 1, dayNum),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        day: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const calendarGrid = getDaysInMonth(currentMonthDate);
  const weekdaysLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const monthName = currentMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const isSelectedToday = isSameDay(selectedDate, new Date());

  // Próximo atendimento agendado do dia
  const now = new Date();
  const nextAppt = appointments.find((app) => {
    if (app.status !== 'PENDING') return false;
    const st = new Date(app.startTime);
    const diffMin = (st.getTime() - now.getTime()) / (1000 * 60);
    return diffMin >= -15 && diffMin <= 45;
  });

  // Filtros da fila
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const canceledOrNoShowCount = appointments.filter(
    (a) => a.status === 'CANCELED' || a.status === 'NO_SHOW'
  ).length;

  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter === 'PENDING') return app.status === 'PENDING';
    if (statusFilter === 'COMPLETED') return app.status === 'COMPLETED';
    if (statusFilter === 'CANCELED_OR_NO_SHOW') {
      return app.status === 'CANCELED' || app.status === 'NO_SHOW';
    }
    return true;
  });

  // Componente renderizável do Calendário
  const renderCalendarContent = () => (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <span>{monthName}</span>
        </h3>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 bg-[#1C1C1C] hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 bg-[#1C1C1C] hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-white/40 pb-1">
        {weekdaysLabels.map((day) => (
          <div key={day} className="py-0.5">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((cell, idx) => {
          const isSelected = isSameDay(cell.date, selectedDate);
          const isToday = isSameDay(cell.date, new Date());
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          const cellDateStr = getYYYYMMDD(cell.date);
          const cellOccupancy = monthOccupancyMap[cellDateStr] || 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedDate(cell.date);
                if (!cell.isCurrentMonth) {
                  setCurrentMonthDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                }
                setIsMobileCalendarOpen(false);
              }}
              className={`relative aspect-square min-h-[38px] p-1 rounded-xl text-center border transition-all flex flex-col items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#D4AF37] text-[#0D0D0D] border-[#D4AF37] shadow-md font-bold scale-[1.03] z-10'
                  : isToday
                  ? 'bg-[#1C1C1C] text-[#D4AF37] border-[#D4AF37]/60 hover:bg-[#151515] font-semibold'
                  : cellOccupancy > 0 && cell.isCurrentMonth
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 font-semibold'
                  : cell.isCurrentMonth
                  ? 'bg-[#1C1C1C]/60 border-white/5 hover:bg-[#1C1C1C] text-white'
                  : 'bg-transparent border-transparent text-white/20'
              } ${isWeekend && !isSelected && cell.isCurrentMonth && !(cellOccupancy > 0) ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-center items-center w-full relative">
                <span
                  className={`text-xs font-semibold ${
                    isSelected
                      ? 'text-[#0D0D0D]'
                      : cellOccupancy > 0 && cell.isCurrentMonth
                      ? 'text-[#D4AF37]'
                      : 'text-white'
                  }`}
                >
                  {cell.day}
                </span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full absolute right-0 top-0.5 ${
                      isSelected ? 'bg-[#0D0D0D]' : 'bg-[#D4AF37]'
                    }`}
                  />
                )}
              </div>

              {cellOccupancy > 0 && cell.isCurrentMonth && (
                <div className="flex flex-col items-center justify-center w-full">
                  <div
                    className={`w-1 h-1 rounded-full mx-auto ${
                      isSelected ? 'bg-[#0D0D0D]' : 'bg-[#D4AF37]'
                    }`}
                  />
                  <span
                    className={`text-[8px] font-bold leading-none mt-0.5 ${
                      isSelected ? 'text-[#0D0D0D]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {cellOccupancy}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-[#FFFFFF] flex flex-col lg:flex-row selection:bg-[#C5A059]/30 font-sans pb-24 lg:pb-0">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main
        id="main-content"
        className="flex-grow px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl"
      >
        
        {/* Cabeçalho da Agenda */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Agenda de Atendimentos
          </h1>
          <p className="text-white/60 text-xs sm:text-sm">
            Consulte os agendamentos do dia, alterne entre datas e registre os resultados dos atendimentos.
          </p>
        </div>

        {/* Barra de Navegação de Datas e Atalhos */}
        <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Dia anterior"
              className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSelectedToday
                  ? 'bg-[#D4AF37] text-[#0D0D0D] border-[#D4AF37]'
                  : 'bg-[#1C1C1C] hover:bg-[#252525] border-white/10 text-white/90 hover:text-white'
              }`}
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Próximo dia"
              className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs sm:text-sm font-semibold text-white">
                {formatSelectedDateFull(selectedDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-white/5">
            <span className="sm:hidden text-xs font-semibold text-white truncate max-w-[200px]">
              {formatSelectedDateFull(selectedDate)}
            </span>

            {/* Botão em telas menores que xl para abrir/fechar o calendário sob demanda */}
            <button
              type="button"
              onClick={() => setIsMobileCalendarOpen(!isMobileCalendarOpen)}
              className="xl:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
              aria-expanded={isMobileCalendarOpen}
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isMobileCalendarOpen ? 'Ocultar calendário' : 'Escolher data'}</span>
              {isMobileCalendarOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Mensagem de Erro Geral com Ação de Recarregamento */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-xs sm:text-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => loadQueue(selectedDate)}
              className="px-3 py-1 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Banner Operacional de Horário Próximo (se houver atendimento iminente) */}
        {nextAppt && (
          <div className="bg-[#151515] border border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] inline-block">
                  Horário Próximo
                </span>
                <h2 className="font-bold text-sm sm:text-base text-white">
                  {nextAppt.clientName} <span className="text-white/60 font-normal">({nextAppt.serviceName})</span>
                </h2>
                <p className="text-xs text-[#D4AF37] font-medium">
                  Horário marcado: {formatTime(nextAppt.startTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRequestComplete(nextAppt)}
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-[#22C55E] hover:bg-[#1DA851] disabled:opacity-50 disabled:cursor-not-allowed text-[#0D0D0D] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {updatingId === nextAppt.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Concluindo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Concluir atendimento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Calendário sob demanda (quando expandido pelo botão "Escolher data") */}
        {isMobileCalendarOpen && (
          <div className="xl:hidden bg-[#151515] border border-white/10 rounded-2xl p-4 shadow-lg animate-fade-in">
            {renderCalendarContent()}
          </div>
        )}

        {/* Layout Principal: Lista Diária Primeiro no Celular e Coluna Dupla no Desktop Amplo */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Coluna Principal (Lista do Dia) -> Exibida Primeiro */}
          <section className="xl:col-span-8 min-w-0 space-y-4 order-1">
            
            {/* Barra de Filtros e Contagem */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Filtrar</span>
                </span>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'ALL'
                        ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                        : 'bg-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Todos ({appointments.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'PENDING'
                        ? 'bg-[#1C1C1C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                        : 'bg-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Agendados ({pendingCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'COMPLETED'
                        ? 'bg-[#1C1C1C] text-[#22C55E] border border-[#22C55E]/40 shadow-sm'
                        : 'bg-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Concluídos ({completedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('CANCELED_OR_NO_SHOW')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'CANCELED_OR_NO_SHOW'
                        ? 'bg-[#1C1C1C] text-[#EF4444] border border-[#EF4444]/40 shadow-sm'
                        : 'bg-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Faltas/Canc. ({canceledOrNoShowCount})
                  </button>
                </div>
              </div>

              <span className="text-xs text-white/50 bg-[#151515] px-2.5 py-1 rounded-full border border-white/5 font-medium shrink-0 self-start sm:self-auto">
                {filteredAppointments.length} exibido{filteredAppointments.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Container da Lista de Atendimentos */}
            <div className="bg-[#151515] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/50 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
                  <span className="text-xs font-semibold">Carregando atendimentos do dia...</span>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-16 text-white/40 font-medium text-xs sm:text-sm px-4">
                  {appointments.length === 0
                    ? 'Nenhum agendamento reservado para esta data.'
                    : 'Nenhum atendimento corresponde ao filtro selecionado.'}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredAppointments.map((app) => {
                    const isCanceled = app.status === 'CANCELED';
                    const isNoShow = app.status === 'NO_SHOW';
                    const isPending = app.status === 'PENDING';
                    const isUpdating = updatingId === app.id;
                    const canModify = isPending || (session?.user?.role === 'ADMIN' && !isCanceled);

                    return (
                      <div
                        key={app.id}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Dados do Atendimento */}
                        <div className="flex gap-3.5 items-center min-w-0">
                          {app.clientImage ? (
                            <Image
                              src={app.clientImage}
                              alt={app.clientName}
                              width={44}
                              height={44}
                              className="w-11 h-11 rounded-xl border border-white/10 object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold shrink-0 text-sm">
                              {app.clientName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                                {app.clientName}
                              </span>
                              {getStatusBadge(app.status)}
                            </div>
                            <span className="block text-xs text-white/60 truncate">
                              {app.serviceName} • <strong className="text-[#D4AF37] font-semibold">{formatPrice(app.servicePrice)}</strong>
                            </span>
                            <span className="block text-xs text-white/80 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-[#D4AF37]" />
                              <span>Horário: {formatTime(app.startTime)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação com Ações Inequívocas */}
                        <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0">
                          {isUpdating ? (
                            <div className="flex items-center gap-2 text-xs text-[#D4AF37] px-3 py-2 bg-[#1C1C1C] rounded-xl border border-white/5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Atualizando...</span>
                            </div>
                          ) : isCanceled ? (
                            <span className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] font-medium text-xs">
                              Cancelado
                            </span>
                          ) : isNoShow ? (
                            <span className="px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] font-medium text-xs">
                              Falta registrada
                            </span>
                          ) : canModify ? (
                            <>
                              <button
                                type="button"
                                id={`btn-complete-${app.id}`}
                                disabled={isSubmitting}
                                onClick={() => handleRequestComplete(app)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#22C55E]/15 hover:bg-[#22C55E] disabled:opacity-50 disabled:cursor-not-allowed border border-[#22C55E]/30 hover:border-transparent text-[#22C55E] hover:text-[#0D0D0D] transition-all cursor-pointer shadow-sm"
                                title="Concluir atendimento"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Concluir</span>
                              </button>

                              <button
                                type="button"
                                id={`btn-noshow-${app.id}`}
                                disabled={isSubmitting}
                                onClick={() => handleRequestNoShow(app)}
                                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#1C1C1C] hover:bg-[#EF4444]/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-[#EF4444]/30 text-white/70 hover:text-[#EF4444] transition-all cursor-pointer"
                                title="Registrar falta do cliente"
                              >
                                <UserIcon className="w-3.5 h-3.5" />
                                <span>Falta</span>
                              </button>

                              <button
                                type="button"
                                id={`btn-cancel-${app.id}`}
                                disabled={isSubmitting}
                                onClick={() => handleRequestCancel(app)}
                                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-transparent hover:bg-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed border border-[#EF4444]/30 text-[#EF4444] hover:text-white transition-all cursor-pointer"
                                title="Cancelar agendamento"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2]" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-white/40 italic bg-[#1C1C1C] border border-white/5 px-3 py-1.5 rounded-lg">
                              Concluído
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Coluna Lateral Desktop (Calendário Sempre Presente em Telas Amplas) */}
          <aside className="hidden xl:block xl:col-span-4 min-w-0 sticky top-6 order-2 space-y-4">
            <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 shadow-lg">
              {renderCalendarContent()}
            </div>

            <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 shadow-md space-y-2 text-xs">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider block">
                Legenda do Calendário
              </span>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-3 h-3 rounded-md bg-[#D4AF37] border border-[#D4AF37] shrink-0" />
                <span>Dia selecionado para visualização</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-3 h-3 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 shrink-0" />
                <span>Dias com atendimentos agendados</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <span className="w-3 h-3 rounded-md bg-[#1C1C1C] border border-[#D4AF37]/60 shrink-0" />
                <span>Data atual (Hoje)</span>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* Diálogo de Confirmação para Ações Críticas */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-action-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => !isSubmitting && setConfirmAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#151515] border border-white/15 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  confirmAction.type === 'EARLY_COMPLETE'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#D4AF37]'
                    : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
                }`}
              >
                {confirmAction.type === 'EARLY_COMPLETE' ? (
                  <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div className="space-y-1">
                <h3 id="confirm-action-title" className="text-base sm:text-lg font-bold text-white">
                  {confirmAction.type === 'EARLY_COMPLETE' && 'Confirmar conclusão antecipada?'}
                  {confirmAction.type === 'NO_SHOW' && 'Registrar falta do cliente?'}
                  {confirmAction.type === 'CANCEL' && 'Cancelar agendamento?'}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  {confirmAction.type === 'EARLY_COMPLETE' &&
                    'O atendimento será registrado como concluído antes do horário agendado e contabilizado em seus relatórios.'}
                  {confirmAction.type === 'NO_SHOW' &&
                    'O cliente será marcado como ausente para este horário (no-show). Esta ação encerra a pendência deste agendamento.'}
                  {confirmAction.type === 'CANCEL' &&
                    'O agendamento será cancelado permanentemente e o horário ficará liberado.'}
                </p>
              </div>
            </div>

            {/* Detalhes da Reserva para Confirmação Segura */}
            <div className="bg-[#1C1C1C] border border-white/5 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Cliente:</span>
                <span className="font-semibold text-white">{confirmAction.appointment.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Serviço:</span>
                <span className="font-semibold text-[#D4AF37]">{confirmAction.appointment.serviceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Horário agendado:</span>
                <span className="font-semibold text-white">
                  {formatTime(confirmAction.appointment.startTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Valor:</span>
                <span className="font-semibold text-white">
                  {formatPrice(confirmAction.appointment.servicePrice)}
                </span>
              </div>
            </div>

            {/* Ações: "Voltar" vs Ação Explícita */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] disabled:opacity-50 border border-white/10 text-white/80 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                id="btn-execute-confirmed-action"
                disabled={isSubmitting}
                onClick={handleExecuteConfirmedAction}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  confirmAction.type === 'EARLY_COMPLETE'
                    ? 'bg-[#D4AF37] hover:bg-[#E2BE4D] text-[#0D0D0D]'
                    : 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>
                    {confirmAction.type === 'EARLY_COMPLETE' && 'Concluir mesmo assim'}
                    {confirmAction.type === 'NO_SHOW' && 'Registrar falta'}
                    {confirmAction.type === 'CANCEL' && 'Cancelar agendamento'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
