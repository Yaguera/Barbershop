'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getBarberAppointmentsAction, changeAppointmentStatusAction, getBarberMonthScheduleAction } from '@/app/actions/appointment-actions';
import { Clock, Check, X, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Calendar, User as UserIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { BarberNavbar } from '@/components/barber/BarberNavbar';

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

export default function BarberAgendaPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null);
  const [monthOccupancyMap, setMonthOccupancyMap] = useState<Record<string, number>>({});

  const formatYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadQueue = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const dateStr = formatYYYYMMDD(selectedDate);
    const result = await getBarberAppointmentsAction(dateStr);
    if (result.success && result.appointments) {
      setAppointments(result.appointments);
      if (result.barberId) setBarberProfileId(result.barberId);
    } else {
      setErrorMsg(result.error || 'Erro ao carregar fila de atendimentos.');
    }
    setIsLoading(false);
  };

  const loadMonthOccupancy = async () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth() + 1;
    const result = await getBarberMonthScheduleAction(year, month, barberProfileId || undefined);
    if (result.success && result.occupancy) {
      const map: Record<string, number> = {};
      result.occupancy.forEach((item) => {
        map[item.date] = item.count;
      });
      setMonthOccupancyMap(map);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  useEffect(() => {
    loadMonthOccupancy();
  }, [currentMonthDate, barberProfileId]);

  const handleStatusChange = async (appointmentId: string, newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW') => {
    setUpdatingId(appointmentId);
    setErrorMsg(null);

    const result = await changeAppointmentStatusAction({
      appointmentId,
      newStatus,
    });

    if (result.success) {
      await loadQueue();
      await loadMonthOccupancy();
    } else {
      setErrorMsg(result.error || 'Erro ao atualizar status');
    }
    setUpdatingId(null);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 text-[10px] uppercase font-black rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">Pendente</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 text-[10px] uppercase font-black rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">Finalizado</span>;
      case 'CANCELED':
        return <span className="px-2.5 py-0.5 text-[10px] uppercase font-black rounded-full bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">Cancelado</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-0.5 text-[10px] uppercase font-black rounded-full bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/40">Não Compareceu</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] uppercase font-black rounded-full bg-white/10 text-white/70">{status}</span>;
    }
  };

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
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        day: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return grid;
  };

  const calendarGrid = getDaysInMonth(currentMonthDate);
  const weekdaysLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handlePrevMonth = () => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonthDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonthDate(d);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const monthName = currentMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Find next upcoming PENDING appointment within 30 minutes from now
  const now = new Date();
  const nextAppt = appointments.find((app) => {
    if (app.status !== 'PENDING') return false;
    const st = new Date(app.startTime);
    const diffMin = (st.getTime() - now.getTime()) / (1000 * 60);
    return diffMin >= -15 && diffMin <= 30; // within current execution or arriving in 30m
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF] flex flex-col selection:bg-[#D4AF37]/30 font-sans pb-20">
      <BarberNavbar barberProfileId={barberProfileId || undefined} />

      <main className="flex-grow max-w-5xl mx-auto px-6 py-8 w-full space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Gestão de Cadeira & Horários
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Meus Atendimentos & Agenda
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Navegue pelo calendário, confira seus horários agendados e gerencie os atendimentos do dia.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-[#EF4444] text-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* VIP Alert Banner for Next Arriving Client */}
        {nextAppt && (
          <div className="bg-gradient-to-r from-[#D4AF37]/20 via-[#151515] to-[#151515] border-2 border-[#D4AF37] rounded-3xl p-5 sm:p-6 shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse-glow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] flex items-center justify-center font-black shadow-lg shrink-0">
                <Clock className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0D0D0D] block w-fit">
                  Chegada Imediata
                </span>
                <h3 className="font-bold text-lg text-white mt-1">
                  {nextAppt.clientName} <span className="text-white/60 font-normal">({nextAppt.serviceName})</span>
                </h3>
                <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">
                  Horário marcado: {new Date(nextAppt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange(nextAppt.id, 'COMPLETED')}
                className="flex-1 sm:flex-initial py-3 px-6 rounded-2xl bg-[#22C55E] hover:bg-[#1DA851] text-[#0D0D0D] font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Iniciar / Concluir</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Monthly Calendar */}
        <div className="bg-[#151515] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              <span>{monthName}</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 bg-[#1C1C1C] hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2.5 bg-[#1C1C1C] hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs uppercase tracking-wider text-white/40 pb-1">
            {weekdaysLabels.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarGrid.map((cell, idx) => {
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, new Date());
              const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
              const cellDateStr = formatYYYYMMDD(cell.date);
              const cellOccupancy = monthOccupancyMap[cellDateStr] || 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    if (!cell.isCurrentMonth) {
                      setCurrentMonthDate(cell.date);
                    }
                  }}
                  className={`relative aspect-square min-h-[44px] p-2 rounded-2xl text-center border transition-all flex flex-col items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#0D0D0D] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/30 font-black scale-105 z-10'
                      : isToday
                      ? 'bg-[#1C1C1C] text-[#D4AF37] border-[#D4AF37]/60 hover:bg-[#151515] font-bold'
                      : cellOccupancy > 0 && cell.isCurrentMonth
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 font-bold'
                      : cell.isCurrentMonth
                      ? 'bg-[#1C1C1C]/60 border-white/5 hover:bg-[#1C1C1C] text-white'
                      : 'bg-transparent border-transparent text-white/20'
                  } ${isWeekend && !isSelected && cell.isCurrentMonth && !(cellOccupancy > 0) ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-center items-center w-full relative">
                    <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-[#0D0D0D]' : cellOccupancy > 0 && cell.isCurrentMonth ? 'text-[#D4AF37]' : 'text-white'}`}>
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute right-0 top-0.5 ${isSelected ? 'bg-[#0D0D0D]' : 'bg-[#D4AF37]'}`} />
                    )}
                  </div>
                  
                  {cellOccupancy > 0 && cell.isCurrentMonth && (
                    <div className="mt-0.5 flex flex-col items-center justify-center w-full">
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 mx-auto ${isSelected ? 'bg-[#0D0D0D]' : 'bg-[#D4AF37]'}`} />
                      <span className={`hidden sm:block text-[9px] font-black mt-0.5 ${isSelected ? 'text-[#0D0D0D]/90' : 'text-[#D4AF37]'}`}>
                        {cellOccupancy} {cellOccupancy === 1 ? 'corte' : 'cortes'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Queue List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <span>Agenda de {selectedDate.toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
            </h3>
            <span className="text-xs text-white/50 bg-[#151515] px-3 py-1.5 rounded-full border border-white/10">
              {appointments.length} {appointments.length === 1 ? 'atendimento' : 'atendimentos'}
            </span>
          </div>

          <div className="bg-[#151515] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/50 gap-3">
                <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
                <span className="text-xs font-semibold">Carregando fila do dia...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-white/40 font-medium text-xs sm:text-sm">
                Nenhum agendamento reservado para esta data até o momento.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {appointments.map((app) => {
                  const startTime = new Date(app.startTime);
                  const isCompleted = app.status === 'COMPLETED';
                  const isCanceled = app.status === 'CANCELED';
                  const isNoShow = app.status === 'NO_SHOW';
                  const isPending = app.status === 'PENDING';
                  const isUpdating = updatingId === app.id;
                  const canModify = isPending || (session?.user?.role === 'ADMIN' && !isCanceled);

                  return (
                    <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      {/* Left: Client info & time */}
                      <div className="flex gap-4 items-center">
                        {app.clientImage ? (
                          <Image
                            src={app.clientImage}
                            alt={app.clientName}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-2xl border border-white/10 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold flex-shrink-0 text-base">
                            {app.clientName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-bold text-white leading-tight">{app.clientName}</span>
                            {getStatusBadge(app.status)}
                          </div>
                          <span className="block text-xs text-white/60">
                            {app.serviceName} • <span className="text-[#D4AF37] font-bold">{formatPrice(app.servicePrice)}</span>
                          </span>
                          <span className="block text-xs font-semibold text-white/80 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D4AF37]" />
                            <span>Início: {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-2.5 self-start md:self-center pt-2 md:pt-0">
                        {isUpdating ? (
                          <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Atualizando...</span>
                          </div>
                        ) : isCanceled ? (
                          <span className="px-3.5 py-2 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] font-semibold text-xs">
                            Cancelado
                          </span>
                        ) : isNoShow ? (
                          <span className="px-3.5 py-2 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] font-semibold text-xs">
                            Ausência / No-Show
                          </span>
                        ) : canModify ? (
                          <>
                            <button
                              id={`btn-complete-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#22C55E]/15 hover:bg-[#22C55E] border border-[#22C55E]/40 hover:border-transparent text-[#22C55E] hover:text-[#0D0D0D] transition-all cursor-pointer shadow-sm hover:scale-105"
                              title="Concluir Atendimento"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>Atender</span>
                            </button>

                            <button
                              id={`btn-noshow-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'NO_SHOW')}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#1C1C1C] hover:bg-[#EF4444]/20 border border-white/10 hover:border-[#EF4444]/40 text-white/70 hover:text-[#EF4444] transition-all cursor-pointer"
                              title="Cliente Não Compareceu"
                            >
                              <UserIcon className="w-4 h-4" />
                              <span>Faltou</span>
                            </button>

                            <button
                              id={`btn-cancel-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'CANCELED')}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-transparent hover:bg-[#EF4444] border border-[#EF4444]/40 text-[#EF4444] hover:text-white transition-all cursor-pointer"
                              title="Cancelar Agendamento"
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-white/40 italic bg-[#1C1C1C] border border-white/10 px-3 py-1.5 rounded-xl">
                            Atendido / Concluído
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
