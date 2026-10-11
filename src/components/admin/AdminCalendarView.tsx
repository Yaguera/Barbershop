'use client';

import { getAdminCalendarMetricsAction } from '@/app/actions/admin-actions';
import { CalendarMetric, DayAppointmentDetail } from '@/core/domain/repositories/AppointmentReportRepository';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  DollarSign,
  Layers,
  RefreshCw,
  Scissors,
  TrendingUp,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discard out-of-order responses across rapid navigation
  const requestIdRef = useRef(0);

  const monthsNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const loadData = useCallback(async () => {
    const currentReqId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (viewMode === 'YEAR') {
        const res = await getAdminCalendarMetricsAction(selectedYear);
        if (currentReqId !== requestIdRef.current) return;

        if (res.success && 'metrics' in res && res.metrics) {
          setMetrics(res.metrics);
        } else {
          setErrorMsg(res.error || 'Erro ao carregar dados do ano.');
        }
      } else if (viewMode === 'MONTH') {
        const res = await getAdminCalendarMetricsAction(selectedYear, selectedMonth);
        if (currentReqId !== requestIdRef.current) return;

        if (res.success && 'metrics' in res && res.metrics) {
          setMetrics(res.metrics);
        } else {
          setErrorMsg(res.error || 'Erro ao carregar dados do mês.');
        }
      } else if (viewMode === 'DAY') {
        const res = await getAdminCalendarMetricsAction(selectedYear, selectedMonth, selectedDay);
        if (currentReqId !== requestIdRef.current) return;

        if (res.success && 'dayDetails' in res && res.dayDetails) {
          setDayAppointments(res.dayDetails.appointments);
        } else {
          setErrorMsg(res.error || 'Erro ao carregar dados do dia.');
        }
      }
    } catch {
      if (currentReqId === requestIdRef.current) {
        setErrorMsg('Falha ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [viewMode, selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Pagination navigation handlers
  const handlePrev = () => {
    if (viewMode === 'YEAR') {
      setSelectedYear((prev) => prev - 1);
    } else if (viewMode === 'MONTH') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear((prev) => prev - 1);
      } else {
        setSelectedMonth((prev) => prev - 1);
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
      setSelectedYear((prev) => prev + 1);
    } else if (viewMode === 'MONTH') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear((prev) => prev + 1);
      } else {
        setSelectedMonth((prev) => prev + 1);
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
  const metricsMap = new Map<
    string,
    {
      count: number;
      revenue: number;
      completed_count?: number;
      pending_count?: number;
      canceled_count?: number;
      no_show_count?: number;
    }
  >();
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

  // Calculate totals for active view with distinct cancellation and no-show counts
  const totalVolume = metrics.reduce((acc, m) => acc + m.count, 0);
  const totalRevenue = metrics.reduce((acc, m) => acc + (m.revenue || 0), 0);
  const totalCompleted = metrics.reduce((acc, m) => acc + (m.completed_count || 0), 0);
  const totalPending = metrics.reduce((acc, m) => acc + (m.pending_count || 0), 0);
  const totalCanceled = metrics.reduce((acc, m) => acc + (m.canceled_count || 0), 0);
  const totalNoShow = metrics.reduce((acc, m) => acc + (m.no_show_count || 0), 0);

  const currentPeriodResetLabel =
    viewMode === 'YEAR' ? 'Ano Atual' : viewMode === 'MONTH' ? 'Mês Atual' : 'Hoje';

  return (
    <div className="space-y-6">
      {/* Header, Context & Navigation */}
      <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumb Context */}
          <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <button
              onClick={() => setViewMode('YEAR')}
              className={`hover:text-white transition-colors cursor-pointer ${
                viewMode === 'YEAR' ? 'text-[#D4AF37] font-bold' : ''
              }`}
            >
              Ano ({selectedYear})
            </button>
            {(viewMode === 'MONTH' || viewMode === 'DAY') && (
              <>
                <span>/</span>
                <button
                  onClick={() => setViewMode('MONTH')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    viewMode === 'MONTH' ? 'text-[#D4AF37] font-bold' : ''
                  }`}
                >
                  {monthsNames[selectedMonth - 1]}
                </button>
              </>
            )}
            {viewMode === 'DAY' && (
              <>
                <span>/</span>
                <span className="text-[#D4AF37] font-bold">Dia {selectedDay}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-6 h-6 text-[#D4AF37]" />
              {viewMode === 'YEAR' && `Visão Anual — ${selectedYear}`}
              {viewMode === 'MONTH' && `Visão Mensal — ${monthsNames[selectedMonth - 1]} de ${selectedYear}`}
              {viewMode === 'DAY' && `Detalhamento Diário — ${selectedDay} de ${monthsNames[selectedMonth - 1]} de ${selectedYear}`}
            </h2>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1C1C1C] text-[11px] font-semibold text-white/60 border border-white/10 self-start sm:self-auto">
              <Users className="w-3 h-3 text-[#D4AF37]" />
              <span>Todos os profissionais</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mode Tabs */}
          <div className="bg-[#1C1C1C] p-1 rounded-xl border border-white/10 flex gap-1">
            <button
              onClick={() => setViewMode('YEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'YEAR'
                  ? 'bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Anual
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'MONTH'
                  ? 'bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'DAY'
                  ? 'bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Diário
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Período anterior"
              className="p-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 rounded-xl text-white transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedYear(now.getFullYear());
                setSelectedMonth(now.getMonth() + 1);
                setSelectedDay(now.getDate());
              }}
              className="px-3 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {currentPeriodResetLabel}
            </button>
            <button
              onClick={handleNext}
              aria-label="Próximo período"
              className="p-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 rounded-xl text-white transition-colors cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">Aviso:</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Summary KPI Banner for Year / Month mode */}
      {viewMode !== 'DAY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#151515] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                  Volume de Atendimentos
                </span>
                <div className="text-3xl font-black text-white">
                  {totalVolume} <span className="text-xs font-normal text-white/50">registrados</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37]">
                <Scissors className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Receita de Atendimentos Concluídos
                </span>
                <div className="text-3xl font-black text-emerald-400">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Status segregation pills with distinct cancellations and no-shows */}
          <div className="flex flex-wrap items-center gap-2.5 px-0.5">
            <div className="px-3 py-1.5 rounded-xl bg-[#151515] border border-white/5 text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluídos: <span className="text-white font-black">{totalCompleted}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#151515] border border-white/5 text-xs font-bold text-[#D4AF37] flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5" /> Pendentes: <span className="text-white font-black">{totalPending}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#151515] border border-white/5 text-xs font-bold text-red-400 flex items-center gap-1.5 shadow-sm">
              <XCircle className="w-3.5 h-3.5" /> Cancelamentos: <span className="text-white font-black">{totalCanceled}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#151515] border border-white/5 text-xs font-bold text-amber-400 flex items-center gap-1.5 shadow-sm">
              <Clock3 className="w-3.5 h-3.5" /> Faltas (No-Show): <span className="text-white font-black">{totalNoShow}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center gap-3 text-white/50">
          <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
          <span className="text-sm font-semibold">Atualizando dados do calendário...</span>
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
                const isCurrentMonth =
                  selectedYear === now.getFullYear() && monthNumber === now.getMonth() + 1;

                const maxCount = Math.max(1, ...metrics.map((m) => m.count));
                const progressPct = Math.min(100, Math.round((data.count / maxCount) * 100));

                return (
                  <div
                    key={monthName}
                    onClick={() => {
                      setSelectedMonth(monthNumber);
                      setViewMode('MONTH');
                    }}
                    className={`group relative bg-[#151515] border rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-lg ${
                      isCurrentMonth
                        ? 'border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                      <span
                        className={`text-base font-extrabold transition-colors ${
                          isCurrentMonth ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'
                        }`}
                      >
                        {monthName}
                      </span>
                      {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4AF37] text-[#0D0D0D] uppercase">
                          Mês Atual
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                        <span className="text-xs text-white/50 font-medium">Atendimentos:</span>
                        <span className="text-xl font-black text-white group-hover:text-[#D4AF37] transition-colors">
                          {data.count}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-white/50">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span>✓ Concluídos:</span>
                          <strong className="text-white">{data.completed_count || 0}</strong>
                        </div>
                        <div className="flex items-center gap-1 text-[#D4AF37]">
                          <span>• Pendentes:</span>
                          <strong className="text-white">{data.pending_count || 0}</strong>
                        </div>
                      </div>

                      {((data.canceled_count || 0) > 0 || (data.no_show_count || 0) > 0) && (
                        <div className="text-[10px] font-semibold text-red-400 flex items-center justify-between">
                          <span>Cancelados / Faltas:</span>
                          <span>
                            {(data.canceled_count || 0) + (data.no_show_count || 0)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xs text-white/50 font-medium">Receita:</span>
                        <span className="text-sm font-black text-emerald-400">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="w-full h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCurrentMonth ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/60 group-hover:bg-[#D4AF37]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#D4AF37]/80 group-hover:text-[#D4AF37] transition-colors">
                      <span>Ver dias do mês</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. MONTH VIEW: classic 7-col grid */}
          {viewMode === 'MONTH' && (
            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <button
                  onClick={() => setViewMode('YEAR')}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para visão anual</span>
                </button>
                <span className="text-xs text-white/40 italic">
                  Clique no dia para visualizar o detalhamento
                </span>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs uppercase tracking-wider text-white/50 pb-1">
                <div className="py-1.5">Seg</div>
                <div className="py-1.5">Ter</div>
                <div className="py-1.5">Qua</div>
                <div className="py-1.5">Qui</div>
                <div className="py-1.5">Sex</div>
                <div className="py-1.5 text-[#D4AF37]/80">Sáb</div>
                <div className="py-1.5 text-[#D4AF37]/80">Dom</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysGrid().map((cell, idx) => {
                  const data = metricsMap.get(cell.dateStr) || { count: 0, revenue: 0 };
                  const isToday =
                    cell.dateStr ===
                    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
                      now.getDate()
                    ).padStart(2, '0')}`;

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
                      className={`relative aspect-square min-h-[3.2rem] p-1.5 sm:p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-black/30 border-white/[0.02] text-white/20 opacity-30'
                          : isToday
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-sm font-bold'
                          : data.count > 0 && cell.isCurrentMonth
                          ? 'bg-[#1C1C1C] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 font-bold'
                          : 'bg-[#151515] border-white/5 hover:border-white/20 text-white'
                      }`}
                    >
                      <div className="flex justify-center items-center w-full relative">
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            isToday
                              ? 'text-[#D4AF37]'
                              : data.count > 0 && cell.isCurrentMonth
                              ? 'text-white'
                              : cell.isCurrentMonth
                              ? 'text-white/80'
                              : 'text-white/30'
                          }`}
                        >
                          {cell.day}
                        </span>
                        {isToday && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] absolute right-0 top-0.5"
                            title="Hoje"
                          />
                        )}
                      </div>

                      {cell.isCurrentMonth && data.count > 0 && (
                        <div className="mt-0.5 flex flex-col items-center justify-center w-full">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37] text-[#0D0D0D] font-black text-[9px] leading-none shadow-xs">
                            {data.count}
                          </span>
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
            <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <button
                  onClick={() => setViewMode('MONTH')}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para grade do mês</span>
                </button>
                <div className="flex items-center gap-4 text-xs font-bold text-white/50">
                  <span>
                    Total: <strong className="text-white text-sm">{dayAppointments.length} agendamentos</strong>
                  </span>
                  <span>
                    Faturamento:{' '}
                    <strong className="text-emerald-400 text-sm">
                      {formatCurrency(
                        dayAppointments.reduce(
                          (sum, a) => sum + (a.status === 'COMPLETED' ? a.servicePrice : 0),
                          0
                        )
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Clock3 className="w-10 h-10 text-white/30 mx-auto" />
                  <p className="text-white/60 font-medium text-sm">
                    Nenhum atendimento registrado para esta data.
                  </p>
                  <button
                    onClick={() => setViewMode('MONTH')}
                    className="px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Voltar e escolher outro dia
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((app) => {
                    const start = new Date(app.startTime);
                    const end = new Date(app.endTime);
                    const timeStr = `${start.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                    const isCompleted = app.status === 'COMPLETED';

                    return (
                      <div
                        key={app.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCompleted
                            ? 'bg-[#1C1C1C]/50 border-white/5'
                            : 'bg-[#151515] border-white/10 hover:border-[#D4AF37]/30'
                        }`}
                      >
                        {/* Time & Service */}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center font-bold min-w-[95px] ${
                              isCompleted
                                ? 'bg-[#151515] border-white/10 text-white/70'
                                : 'bg-[#1C1C1C] border-[#D4AF37]/30 text-[#D4AF37]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 mb-0.5 opacity-80" />
                            <span className="text-xs">{timeStr}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white">{app.clientName}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  isCompleted
                                    ? 'bg-[#052e16] text-[#22C55E] border-[#14532d]'
                                    : app.status === 'PENDING'
                                    ? 'bg-[#1C1C1C] text-[#D4AF37] border-[#D4AF37]/30'
                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                                }`}
                              >
                                {isCompleted
                                  ? 'Concluído'
                                  : app.status === 'PENDING'
                                  ? 'Agendado'
                                  : app.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50 font-medium">
                              <span className="flex items-center gap-1">
                                <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                                {app.serviceName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-white/40" />
                                Barbeiro: <strong className="text-white/80">{app.barberName}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Revenue */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 gap-1">
                          <span className="text-xs text-white/50 font-medium">Valor do Serviço:</span>
                          <span className="text-base font-black text-emerald-400 flex items-center gap-1">
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
