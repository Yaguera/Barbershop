"use client";

import { Calendar, Filter, RefreshCw } from "lucide-react";
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
      ? `Desempenho de ${selectedBarber.name}`
      : "Análises da Barbearia";

  const periodOptions: { key: DashboardPeriod; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "week", label: "Esta semana" },
    { key: "month", label: "Este mês" },
    { key: "year", label: "Este ano" },
    { key: "all", label: "Geral" },
  ];

  return (
    <div className="bg-[#151515] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
      {/* 1. Header: Contexto + Timestamp de Atualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{contextTitle}</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Acompanhe o caixa, a produção da equipe e o retorno dos clientes.
          </p>
        </div>

        {/* Timestamp & Botão de Atualizar */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastUpdated && (
            <span className="text-xs text-white/50">
              Atualizado às {lastUpdated}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-h-11 min-w-11 p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-[#D4AF37] transition-all disabled:opacity-50 cursor-pointer"
              title="Atualizar dados agora"
              aria-label="Atualizar dados"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#D4AF37]" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Filtros e Intervalo Exato de Datas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-white/5">
        {/* Intervalo Exato de Datas Badge */}
        {dateIntervalLabel && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs text-white/80 font-medium self-start">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              Período:{" "}
              <strong className="text-white font-semibold">
                {dateIntervalLabel}
              </strong>
            </span>
          </div>
        )}

        {/* Controles de Filtro: Barbeiro + Período */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Barbeiro */}
          <div className="flex items-center gap-2 bg-[#1C1C1C] px-3.5 py-2 rounded-xl border border-white/10 text-xs text-white/80">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            <select
              value={selectedBarberId}
              onChange={(e) => onBarberChange(e.target.value)}
              className="min-h-11 max-w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer"
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
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Períodos */}
          <div className="flex flex-wrap items-center gap-1 bg-[#1C1C1C] p-1 rounded-xl border border-white/10">
            {periodOptions.map((opt) => {
              const active = period === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onPeriodChange(opt.key)}
                  className={`min-h-11 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
