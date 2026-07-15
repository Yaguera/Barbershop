'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getBarberAppointmentsAction, changeAppointmentStatusAction } from '@/app/actions/appointment-actions';
import { Clock, Check, X, AlertOctagon, RefreshCw, ChevronLeft, ChevronRight, Calendar, User as UserIcon, LogOut } from 'lucide-react';
import Link from 'next/link';

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

export default function BarberDashboard() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    } else {
      setErrorMsg(result.error || 'Erro ao carregar fila.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleStatusChange = async (appointmentId: string, newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW') => {
    setUpdatingId(appointmentId);
    setErrorMsg(null);

    const result = await changeAppointmentStatusAction({
      appointmentId,
      newStatus,
    });

    if (result.success) {
      await loadQueue();
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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pendente</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Finalizado</span>;
      case 'CANCELED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">Cancelado</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-650 border border-zinc-800">Não Compareceu</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-650">{status}</span>;
    }
  };

  // 1. Calendar Helper Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // JS getDay(): 0 = Sunday, 1 = Monday, etc.
    // Shift to make Monday = 0 and Sunday = 6 (conforming to the image)
    let startingDayIndex = firstDay.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid: { day: number; date: Date; isCurrentMonth: boolean }[] = [];
    
    // Trailing days from previous month
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      grid.push({
        day: dayNum,
        date: new Date(year, month - 1, dayNum),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Trailing days from next month to make exactly 42 cells (6 rows)
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

  return (
    <div className="min-h-screen bg-preto-classico text-off-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-preto-classico/95 backdrop-blur-md text-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="José Carlos Barber Shop Logo" className="w-10 h-10 rounded-full border border-carvalho/30" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent hidden sm:inline">
              José Carlos Barber Shop
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Barbeiro'}
                  className="w-8 h-8 rounded-full border border-carvalho/20 object-cover"
                />
              )}
              <span className="text-sm text-zinc-350">
                Barbeiro: <span className="text-white font-semibold">{session?.user?.name}</span>
              </span>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Perfil
            </Link>
            
            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-650/15 hover:bg-red-650/25 text-red-400 border border-red-500/25 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-preto-classico tracking-tight">Fila de Atendimento</h1>
          <p className="text-off-white text-sm">Visualize a agenda mensal e controle os seus atendimentos diários.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            <AlertOctagon className="w-5 h-5 flex-shrink-0 text-vermelho-classico" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* 2. Interactive Monthly Calendar (Screenshot inspired) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
            <h2 className="text-lg font-bold text-preto-classico uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-carvalho" />
              {monthName}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-800 rounded-xl text-off-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-800 rounded-xl text-off-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-zinc-400 pb-1">
            {weekdaysLabels.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Calendar grid cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((cell, idx) => {
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, new Date());
              const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6; // Sun = 0, Sat = 6

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    // Automatically switch month view if clicked day is outside active month
                    if (!cell.isCurrentMonth) {
                      setCurrentMonthDate(cell.date);
                    }
                  }}
                  className={`relative aspect-[4/3] sm:aspect-[1.5/1] p-2 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-azul-barbeiro text-white border-azul-barbeiro shadow-md shadow-blue-500/10'
                      : isToday
                      ? 'bg-carvalho/10 text-nogueira border-carvalho/50 hover:bg-carvalho/20 font-bold'
                      : cell.isCurrentMonth
                      ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 text-off-white'
                      : 'bg-transparent border-transparent text-zinc-300 opacity-40'
                  } ${
                    isWeekend && !isSelected && cell.isCurrentMonth
                      ? 'bg-zinc-50/55 text-zinc-500' 
                      : ''
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                    {cell.day}
                  </span>
                  
                  {/* Small decorative indicator for today */}
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-nogueira absolute bottom-2 right-2"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Daily Appointments List */}
        <div className="space-y-4">
          <h3 className="font-bold text-preto-classico text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-carvalho" />
            Agenda para o dia {selectedDate.toLocaleDateString('pt-BR', { dateStyle: 'long' })}
          </h3>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
                <RefreshCw className="w-7 h-7 animate-spin text-azul-barbeiro" />
                <span>Carregando fila...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 font-medium">
                Nenhum agendamento encontrado para este dia.
              </div>
            ) : (
              <div className="divide-y divide-zinc-150">
                {appointments.map((app) => {
                  const startTime = new Date(app.startTime);
                  const isCompleted = app.status === 'COMPLETED';
                  const isUpdating = updatingId === app.id;
                  const canModify = !isCompleted || session?.user?.role === 'ADMIN';

                  return (
                    <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/30 transition-colors">
                      {/* Left: Client image, details & time */}
                      <div className="flex gap-4 items-center">
                        {app.clientImage ? (
                          <img
                            src={app.clientImage}
                            alt={app.clientName}
                            className="w-12 h-12 rounded-full border border-zinc-800 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-800 flex items-center justify-center text-carvalho font-bold flex-shrink-0">
                            {app.clientName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-preto-classico leading-tight">{app.clientName}</span>
                            {getStatusBadge(app.status)}
                          </div>
                          <span className="block text-sm text-zinc-500">{app.serviceName} (<span className="text-azul-barbeiro font-semibold">{formatPrice(app.servicePrice)}</span>)</span>
                          <span className="block text-xs font-semibold text-carvalho">
                            Horário: {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-start md:self-center">
                        {isUpdating ? (
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <RefreshCw className="w-4 h-4 animate-spin text-azul-barbeiro" />
                            Atualizando...
                          </div>
                        ) : canModify ? (
                          <>
                            <button
                              id={`btn-complete-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                              className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-azul-barbeiro hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm"
                              title="Concluir Atendimento"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Atender
                            </button>
                            <button
                              id={`btn-noshow-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'NO_SHOW')}
                              className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-off-white transition-colors border border-zinc-250 cursor-pointer"
                              title="Cliente Não Compareceu"
                            >
                              <UserIcon className="w-3.5 h-3.5" />
                              Faltou
                            </button>
                            <button
                              id={`btn-cancel-${app.id}`}
                              onClick={() => handleStatusChange(app.id, 'CANCELED')}
                              className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-vermelho-classico/10 hover:bg-vermelho-classico/20 text-vermelho-classico transition-colors border border-vermelho-classico/20 cursor-pointer"
                              title="Cancelar Agendamento"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 italic bg-zinc-800 border border-zinc-150 px-3 py-1.5 rounded-lg">
                            Faturamento Imutável (Apenas Admin)
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
