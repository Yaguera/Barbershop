"use client";

import { Calendar, Clock, Filter, RefreshCw } from "lucide-react";
import type { AdminBarberProp, DashboardPeriod } from "./dashboard-types";

interface DashboardFiltersProps {
  period: DashboardPeriod;
  selectedBarberId: string;
  barbers: AdminBarberProp[];
  dateIntervalLabel?: string;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPeriodChange: (value: DashboardPeriod) => void;
  onBarberChange: (value: string) => void;
}

export function DashboardFilters({
  period,
  selectedBarberId,
  barbers,
  dateIntervalLabel,
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  onPeriodChange,
  onBarberChange,
}: DashboardFiltersProps) {
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);
  const contextTitle =
    selectedBarberId !== "all" && selectedBarber
      ? `Visão geral · ${selectedBarber.name}${selectedBarber.active === false ? " (Inativo)" : ""}`
      : "Visão geral da barbearia";

  const periodOptions: { key: DashboardPeriod; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "week", label: "Esta semana" },
    { key: "month", label: "Mês atual" },
    { key: "year", label: "Este ano" },
    { key: "all", label: "Geral" },
  ];

  return (
    <div className="bg-[#151515] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* 1. Cabeçalho Compacto: Visão geral + Datas efetivas + Última apuração */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {contextTitle}
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Produção por data do serviço · Caixa por data de confirmação · Fuso America/Sao_Paulo
          </p>
        </div>

        {/* Timestamp do Servidor & Botão de Atualizar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {dateIntervalLabel && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs text-zinc-200 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{dateIntervalLabel}</span>
            </div>
          )}
          {lastUpdated && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Apurado às {lastUpdated}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-h-11 min-w-11 p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-[#D4AF37] transition-all disabled:opacity-50 cursor-pointer"
              title="Atualizar apuração agora"
              aria-label="Atualizar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#D4AF37]" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra Principal de Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/10">
        {/* Seletor de Períodos */}
        <div
          className="flex flex-wrap items-center gap-1 bg-[#1C1C1C] p-1 rounded-xl border border-white/10"
          role="group"
          aria-label="Selecionar período de análise"
        >
          {periodOptions.map((opt) => {
            const active = period === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onPeriodChange(opt.key)}
                className={`min-h-10 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Seletor de Profissional (inclui ativos e histórico de inativos) */}
        <div className="flex items-center gap-2 bg-[#1C1C1C] px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white/80">
          <Filter className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <label htmlFor="dashboard-barber-filter" className="text-zinc-400 shrink-0">
            Profissional:
          </label>
          <select
            id="dashboard-barber-filter"
            value={selectedBarberId}
            onChange={(e) => onBarberChange(e.target.value)}
            className="min-h-10 max-w-full bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            aria-label="Filtrar por profissional"
          >
            <option value="all" className="bg-[#1C1C1C] text-white">
              Todos os Barbeiros
            </option>
            {barbers.map((b) => (
              <option
                key={b.id}
                value={b.id}
                className="bg-[#1C1C1C] text-white"
              >
                {b.name}
                {b.active === false ? " (Inativo)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
