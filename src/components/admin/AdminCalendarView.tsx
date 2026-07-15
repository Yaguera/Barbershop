'use client';

import { useState, useEffect } from 'react';
import { getAdminCalendarMetricsAction } from '@/app/actions/admin-actions';
import { CalendarMetric, DayAppointmentDetail } from '@/core/domain/repositories/AppointmentRepository';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  DollarSign, 
  CheckCircle2, 
  Clock3, 
  RefreshCw, 
  Layers, 
  CalendarDays, 
  ArrowLeft,
  TrendingUp,
  Award
} from 'lucide-react';

type ViewMode = 'YEAR' | 'MONTH' | 'DAY';

export function AdminCalendarView() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('YEAR');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  const [metrics, setMetrics] = useState<CalendarMetric[]>([]);
  const [dayAppointments, setDayAppointments] = useState<DayAppointmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const monthsNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'YEAR') {
        const res = await getAdminCalendarMetricsAction(selectedYear);
        if (res.success && 'metrics' in res && res.metrics) {
          setMetrics(res.metrics);
        }
      } else if (viewMode === 'MONTH') {
        const res = await getAdminCalendarMetricsAction(selectedYear, selectedMonth);
        if (res.success && 'metrics' in res && res.metrics) {
          setMetrics(res.metrics);
        }
      } else if (viewMode === 'DAY') {
        const res = await getAdminCalendarMetricsAction(selectedYear, selectedMonth, selectedDay);
        if (res.success && 'dayDetails' in res && res.dayDetails) {
          setDayAppointments(res.dayDetails.appointments);
        }
      }
    } catch (err) {
      console.error('Error loading calendar metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedYear, selectedMonth, selectedDay]);

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Pagination navigation handlers
  const handlePrev = () => {
    if (viewMode === 'YEAR') {
      setSelectedYear(prev => prev - 1);
    } else if (viewMode === 'MONTH') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else if (viewMode === 'DAY') {
      const d = new Date(selectedYear, selectedMonth - 1, selectedDay - 1);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth() + 1);
      setSelectedDay(d.getDate());
    }
  };

  const handleNext = () => {
    if (viewMode === 'YEAR') {
      setSelectedYear(prev => prev + 1);
    } else if (viewMode === 'MONTH') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    } else if (viewMode === 'DAY') {
      const d = new Date(selectedYear, selectedMonth - 1, selectedDay + 1);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth() + 1);
      setSelectedDay(d.getDate());
    }
  };

  // Month grid helper
  const getDaysGrid = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    let startDayIndex = firstDay.getDay() - 1; // Mon = 0, Sun = 6
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

    const grid: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Prev month days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      grid.push({ day: dNum, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      grid.push({ day: i, isCurrentMonth: true, dateStr });
    }

    // Next month days to reach 42 cells
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      grid.push({ day: i, isCurrentMonth: false, dateStr });
    }

    return grid;
  };

  // Convert metrics array to lookup map
  const metricsMap = new Map<string, { count: number; revenue: number; completed_count?: number; pending_count?: number; canceled_count?: number; no_show_count?: number }>();
  metrics.forEach((m) => {
    metricsMap.set(m.date, {
      count: m.count,
      revenue: m.revenue || 0,
      completed_count: m.completed_count || 0,
      pending_count: m.pending_count || 0,
      canceled_count: m.canceled_count || 0,
      no_show_count: m.no_show_count || 0,
    });
  });

  // Calculate totals for active view
  const totalVolume = metrics.reduce((acc, m) => acc + m.count, 0);
  const totalRevenue = metrics.reduce((acc, m) => acc + (m.revenue || 0), 0);
  const totalCompleted = metrics.reduce((acc, m) => acc + (m.completed_count || 0), 0);
  const totalPending = metrics.reduce((acc, m) => acc + (m.pending_count || 0), 0);
  const totalCanceled = metrics.reduce((acc, m) => acc + (m.canceled_count || 0) + (m.no_show_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Mode Selector & Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-carvalho" />
            <span 
              onClick={() => setViewMode('YEAR')} 
              className={`cursor-pointer hover:text-white transition-colors ${viewMode === 'YEAR' ? 'text-amber-400 font-bold underline' : ''}`}
            >
              Ano ({selectedYear})
            </span>
            {(viewMode === 'MONTH' || viewMode === 'DAY') && (
              <>
                <span>/</span>
                <span 
                  onClick={() => setViewMode('MONTH')} 
                  className={`cursor-pointer hover:text-white transition-colors ${viewMode === 'MONTH' ? 'text-amber-400 font-bold underline' : ''}`}
                >
                  {monthsNames[selectedMonth - 1]}
                </span>
              </>
            )}
            {viewMode === 'DAY' && (
              <>
                <span>/</span>
                <span className="text-amber-400 font-bold underline">
                  Dia {selectedDay}
                </span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-amber-500" />
            {viewMode === 'YEAR' && `Visão Geral Anual - ${selectedYear}`}
            {viewMode === 'MONTH' && `Visão Mensal - ${monthsNames[selectedMonth - 1]} de ${selectedYear}`}
            {viewMode === 'DAY' && `Detalhamento Diário - ${selectedDay} de ${monthsNames[selectedMonth - 1]} (${selectedYear})`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mode Tabs */}
          <div className="bg-zinc-950 p-1 rounded-2xl border border-zinc-800 flex gap-1">
            <button
              onClick={() => setViewMode('YEAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'YEAR'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anual
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'MONTH'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'DAY'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Diário
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedYear(now.getFullYear());
                setSelectedMonth(now.getMonth() + 1);
                setSelectedDay(now.getDate());
              }}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white transition-colors cursor-pointer"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Banner for Year / Month mode */}
      {viewMode !== 'DAY' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Volume Total no Período
                </span>
                <div className="text-3xl font-black text-white">
                  {totalVolume} <span className="text-sm font-normal text-zinc-400">agendamentos</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xl">
                📊
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/90 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Receita Realizada (Concluídos)
                </span>
                <div className="text-3xl font-black text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xl">
                💰
              </div>
            </div>
          </div>

          {/* Status segregation pills */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <div className="px-3 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluídos: <span className="text-white font-black">{totalCompleted}</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-amber-400 flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5" /> Pendentes: <span className="text-white font-black">{totalPending}</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-red-400 flex items-center gap-1.5 shadow-sm">
              <span className="font-black text-sm">✕</span> Cancelados/Faltas: <span className="text-white font-black">{totalCanceled}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-semibold">Carregando dados agregados do calendário...</span>
        </div>
      ) : (
        <>
          {/* 1. YEAR VIEW: 12 months cards */}
          {viewMode === 'YEAR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {monthsNames.map((monthName, idx) => {
                const monthNumber = idx + 1;
                const dateKey = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
                const data = metricsMap.get(dateKey) || { count: 0, revenue: 0 };
                const isCurrentMonth = selectedYear === now.getFullYear() && monthNumber === now.getMonth() + 1;

                // Max count to normalize progress bar
                const maxCount = Math.max(1, ...metrics.map(m => m.count));
                const progressPct = Math.min(100, Math.round((data.count / maxCount) * 100));

                return (
                  <div
                    key={monthName}
                    onClick={() => {
                      setSelectedMonth(monthNumber);
                      setViewMode('MONTH');
                    }}
                    className={`group relative bg-zinc-900 border rounded-3xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-lg ${
                      isCurrentMonth
                        ? 'border-amber-500/60 bg-gradient-to-b from-zinc-900 to-amber-950/20 shadow-amber-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
                      <span className={`text-base font-extrabold transition-colors ${isCurrentMonth ? 'text-amber-400' : 'text-white group-hover:text-amber-400'}`}>
                        {monthName}
                      </span>
                      {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950 uppercase">
                          Mês Atual
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-baseline justify-between border-b border-zinc-800/60 pb-2">
                        <span className="text-xs text-zinc-400 font-medium">Total de Agend.:</span>
                        <span className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                          {data.count}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-zinc-400">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span>✓ Concluídos:</span>
                          <strong className="text-white">{data.completed_count || 0}</strong>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <span>⏳ Pendentes:</span>
                          <strong className="text-white">{data.pending_count || 0}</strong>
                        </div>
                      </div>

                      {((data.canceled_count || 0) > 0 || (data.no_show_count || 0) > 0) && (
                        <div className="text-[10px] font-bold text-red-400 flex items-center justify-between">
                          <span>Cancelados / Faltas:</span>
                          <span>{(data.canceled_count || 0) + (data.no_show_count || 0)}</span>
                        </div>
                      )}

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xs text-zinc-400 font-medium">Receita Realizada:</span>
                        <span className="text-sm font-black text-emerald-400">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCurrentMonth ? 'bg-amber-400' : 'bg-amber-500/70 group-hover:bg-amber-400'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-amber-400/80 group-hover:text-amber-400 transition-colors">
                      <span>Explorar dias</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. MONTH VIEW: classic 7-col grid */}
          {viewMode === 'MONTH' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setViewMode('YEAR')}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para visão anual
                </button>
                <span className="text-xs text-zinc-400 italic">
                  Clique no dia para visualizar o detalhamento hora a hora
                </span>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs uppercase tracking-wider text-zinc-400 pb-1">
                <div className="py-2">Seg</div>
                <div className="py-2">Ter</div>
                <div className="py-2">Qua</div>
                <div className="py-2">Qui</div>
                <div className="py-2">Sex</div>
                <div className="py-2 text-amber-500/80">Sáb</div>
                <div className="py-2 text-amber-500/80">Dom</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysGrid().map((cell, idx) => {
                  const data = metricsMap.get(cell.dateStr) || { count: 0, revenue: 0 };
                  const isToday = cell.dateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const parts = cell.dateStr.split('-').map(Number);
                        setSelectedYear(parts[0]);
                        setSelectedMonth(parts[1]);
                        setSelectedDay(parts[2]);
                        setViewMode('DAY');
                      }}
                      className={`relative aspect-[1.1/1] p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-zinc-950/40 border-zinc-900/60 text-zinc-600 opacity-50'
                          : isToday
                          ? 'bg-gradient-to-br from-amber-500/20 to-zinc-900 border-amber-500/60 shadow-md shadow-amber-500/10 text-white'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className={`text-sm font-black ${isToday ? 'text-amber-400' : cell.isCurrentMonth ? 'text-white' : 'text-zinc-600'}`}>
                          {cell.day}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-zinc-950 uppercase">
                            Hoje
                          </span>
                        )}
                      </div>

                      {/* Day metrics badge */}
                      {cell.isCurrentMonth && (
                        <div className="mt-1 w-full space-y-1">
                          {data.count > 0 ? (
                            <>
                              <div className="px-1.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-amber-400 font-extrabold text-[10px]">
                                <span>{data.count} {data.count === 1 ? 'agend.' : 'agend.'}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-bold text-zinc-300 px-0.5">
                                <span className="text-emerald-400" title="Concluídos">✓ {data.completed_count || 0}</span>
                                <span className="text-amber-400" title="Pendentes">⏳ {data.pending_count || 0}</span>
                                {((data.canceled_count || 0) > 0 || (data.no_show_count || 0) > 0) && (
                                  <span className="text-red-400" title="Cancelados/Faltas">✕ {(data.canceled_count || 0) + (data.no_show_count || 0)}</span>
                                )}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-400 truncate px-0.5">
                                {formatCurrency(data.revenue)}
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] font-medium text-zinc-600 italic py-1">
                              Sem fluxo
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DAY VIEW: hourly breakdown */}
          {viewMode === 'DAY' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <button
                  onClick={() => setViewMode('MONTH')}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para grade do mês
                </button>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                  <span>Total do Dia: <strong className="text-white text-sm">{dayAppointments.length} agendamentos</strong></span>
                  <span>Faturamento: <strong className="text-emerald-400 text-sm">{formatCurrency(dayAppointments.reduce((sum, a) => sum + (a.status === 'COMPLETED' ? a.servicePrice : 0), 0))}</strong></span>
                </div>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Clock3 className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-zinc-400 font-semibold text-base">Nenhum atendimento realizado ou agendado para esta data.</p>
                  <button
                    onClick={() => setViewMode('MONTH')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Voltar e escolher outro dia
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((app) => {
                    const start = new Date(app.startTime);
                    const end = new Date(app.endTime);
                    const timeStr = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                    const isCompleted = app.status === 'COMPLETED';

                    return (
                      <div
                        key={app.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCompleted
                            ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                        }`}
                      >
                        {/* Time & Service */}
                        <div className="flex items-start gap-4">
                          <div className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center font-bold min-w-[100px] ${
                            isCompleted
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            <Clock className="w-4 h-4 mb-0.5 opacity-80" />
                            <span className="text-xs">{timeStr}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-extrabold text-white">{app.clientName}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isCompleted
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : app.status === 'PENDING'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
                              }`}>
                                {isCompleted ? 'Concluído' : app.status === 'PENDING' ? 'Agendado' : app.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                                {app.serviceName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-blue-400" />
                                Barbeiro: <strong className="text-zinc-200">{app.barberName}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Revenue badge */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800 gap-1">
                          <span className="text-xs text-zinc-400 font-medium">Valor do Serviço:</span>
                          <span className="text-lg font-black text-emerald-400 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(app.servicePrice)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
