"use client";

import type {
  BookingOriginFilter,
  InsightComparisonMode,
  PaymentMethodFilter,
} from "@/core/domain/repositories/AdminInsightsRepository";
import {
  ArrowLeftRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Info,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  AdminBarberProp,
  AdminServiceProp,
  DashboardFilterState,
  DashboardPeriod,
} from "./dashboard-types";

interface DashboardFiltersProps {
  period: DashboardPeriod;
  selectedBarberId: string;
  barbers: AdminBarberProp[];
  services?: AdminServiceProp[];
  filterState?: DashboardFilterState;
  dateIntervalLabel?: string;
  comparisonIntervalLabel?: string;
  comparisonEquivalenceNote?: string;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPeriodChange: (value: DashboardPeriod) => void;
  onBarberChange: (value: string) => void;
  onApplyFilters?: (next: DashboardFilterState) => void;
  onResetFilters?: () => void;
}

const ORIGIN_OPTIONS: { key: BookingOriginFilter; label: string }[] = [
  { key: "ONLINE", label: "Online (App)" },
  { key: "WHATSAPP", label: "WhatsApp (Recepção)" },
  { key: "WALK_IN", label: "Presencial (Balcão)" },
];

const PAYMENT_METHOD_OPTIONS: { key: PaymentMethodFilter; label: string }[] = [
  { key: "PIX", label: "Pix" },
  { key: "MONEY", label: "Dinheiro" },
  { key: "CARD", label: "Cartão" },
];

export function DashboardFilters({
  period,
  selectedBarberId,
  barbers,
  services = [],
  filterState,
  dateIntervalLabel,
  comparisonIntervalLabel,
  comparisonEquivalenceNote,
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  onPeriodChange,
  onBarberChange,
  onApplyFilters,
  onResetFilters,
}: DashboardFiltersProps) {
  const effectiveFilter: DashboardFilterState = filterState ?? {
    period,
    customStart: "",
    customEnd: "",
    compareMode: "none",
    compareStart: "",
    compareEnd: "",
    barberIds:
      selectedBarberId && selectedBarberId !== "all" ? [selectedBarberId] : [],
    serviceIds: [],
    origins: [],
    paymentMethods: [],
  };

  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<DashboardFilterState>(effectiveFilter);
  const [customStartDraft, setCustomStartDraft] = useState(
    effectiveFilter.customStart,
  );
  const [customEndDraft, setCustomEndDraft] = useState(
    effectiveFilter.customEnd,
  );
  const [compareStartDraft, setCompareStartDraft] = useState(
    effectiveFilter.compareStart,
  );
  const [compareEndDraft, setCompareEndDraft] = useState(
    effectiveFilter.compareEnd,
  );

  // Close period dropdown and advanced modal when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        isPeriodMenuOpen &&
        periodMenuRef.current &&
        !periodMenuRef.current.contains(event.target as Node)
      ) {
        setIsPeriodMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPeriodMenuOpen(false);
        setIsAdvancedOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPeriodMenuOpen]);

  const openAdvancedPanel = () => {
    setDraft(effectiveFilter);
    setCustomStartDraft(effectiveFilter.customStart);
    setCustomEndDraft(effectiveFilter.customEnd);
    setCompareStartDraft(effectiveFilter.compareStart);
    setCompareEndDraft(effectiveFilter.compareEnd);
    setIsPeriodMenuOpen(false);
    setIsAdvancedOpen(true);
  };

  const toggleItem = <T extends string>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const activeFilterCount =
    effectiveFilter.barberIds.length +
    effectiveFilter.serviceIds.length +
    effectiveFilter.origins.length +
    effectiveFilter.paymentMethods.length +
    (effectiveFilter.compareMode !== "none" ? 1 : 0) +
    (effectiveFilter.period === "custom" ? 1 : 0);

  const selectedBarberNames = effectiveFilter.barberIds
    .map((id) => {
      const b = barbers.find((item) => item.id === id);
      return b ? `${b.name}${b.active === false ? " (Inativo)" : ""}` : id;
    })
    .filter(Boolean);

  const contextTitle =
    selectedBarberNames.length === 1
      ? `Visão geral · ${selectedBarberNames[0]}`
      : selectedBarberNames.length > 1
        ? `Visão geral · ${selectedBarberNames.length} profissionais`
        : "Visão geral da barbearia";

  const quickPeriods: { key: DashboardPeriod; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "yesterday", label: "Ontem" },
    { key: "last_7_days", label: "Últimos 7 dias" },
    { key: "last_30_days", label: "Últimos 30 dias" },
    { key: "last_90_days", label: "Últimos 90 dias" },
    { key: "week", label: "Esta semana" },
    { key: "month", label: "Mês atual" },
    { key: "prev_month", label: "Mês anterior" },
    { key: "year", label: "Este ano" },
    { key: "custom", label: "Intervalo personalizado" },
    { key: "all", label: "Todo o histórico (Geral)" },
  ];

  const activePeriodLabel =
    quickPeriods.find((opt) => opt.key === effectiveFilter.period)?.label ||
    "Mês atual";

  const handleQuickPeriodClick = (nextPeriod: DashboardPeriod) => {
    if (nextPeriod === "custom") {
      const todayIso = new Date().toISOString().slice(0, 10);
      const start = effectiveFilter.customStart || todayIso;
      const end = effectiveFilter.customEnd || todayIso;
      setCustomStartDraft(start);
      setCustomEndDraft(end);
      setIsPeriodMenuOpen(false);
      if (onApplyFilters) {
        onApplyFilters({
          ...effectiveFilter,
          period: "custom",
          customStart: start,
          customEnd: end,
        });
      } else {
        onPeriodChange("custom");
      }
      return;
    }
    setIsPeriodMenuOpen(false);
    if (onApplyFilters) {
      onApplyFilters({
        ...effectiveFilter,
        period: nextPeriod,
        compareMode:
          nextPeriod === "all" ? "none" : effectiveFilter.compareMode,
      });
    } else {
      onPeriodChange(nextPeriod);
    }
  };

  const handleCompareModeChange = (nextMode: InsightComparisonMode) => {
    if (!onApplyFilters) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const compareStart =
      nextMode === "custom"
        ? effectiveFilter.compareStart || todayIso
        : effectiveFilter.compareStart;
    const compareEnd =
      nextMode === "custom"
        ? effectiveFilter.compareEnd || todayIso
        : effectiveFilter.compareEnd;
    setCompareStartDraft(compareStart);
    setCompareEndDraft(compareEnd);
    onApplyFilters({
      ...effectiveFilter,
      compareMode: nextMode,
      compareStart,
      compareEnd,
    });
  };

  const removeChip = (patch: Partial<DashboardFilterState>) => {
    if (!onApplyFilters) return;
    onApplyFilters({
      ...effectiveFilter,
      ...patch,
    });
  };

  return (
    <div className="bg-[#151515] border border-white/10 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* 1. Cabeçalho Compacto: Visão geral + Datas efetivas + Última apuração */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {contextTitle}
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Produção por data do serviço · Caixa por data de confirmação · Fuso
            America/Sao_Paulo
          </p>
        </div>

        {/* Timestamp do Servidor & Botão de Atualizar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {dateIntervalLabel && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1C] border border-white/10 text-xs text-zinc-200 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Atual: {dateIntervalLabel}</span>
            </div>
          )}
          {comparisonIntervalLabel && effectiveFilter.compareMode !== "none" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-semibold">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Ref.: {comparisonIntervalLabel}</span>
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
              className="min-h-10 min-w-10 p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 hover:text-[#D4AF37] transition-all disabled:opacity-50 cursor-pointer"
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

      {/* Nota de equivalência de comparação temporal */}
      {comparisonEquivalenceNote && effectiveFilter.compareMode !== "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-3.5 py-2 text-xs text-amber-200">
          <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{comparisonEquivalenceNote}</span>
        </div>
      )}

      {/* Aviso explícito quando filtro de método de pagamento está ativo */}
      {effectiveFilter.paymentMethods.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/25 px-3.5 py-2 text-xs text-sky-200">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Filtro de forma de pagamento ativo (
            {effectiveFilter.paymentMethods
              .map(
                (m) =>
                  PAYMENT_METHOD_OPTIONS.find((o) => o.key === m)?.label || m,
              )
              .join(", ")}
            ): restringe exclusivamente o <strong>Recebido no caixa</strong>; a
            produção realizada inclui serviços ainda sem pagamento confirmado.
          </span>
        </div>
      )}

      {/* 2. Barra Principal de Filtros estilo Kommo (Apenas o período aplicado visível; abre menu ao clicar) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Seletor de Período Compacto estilo Kommo */}
          <div className="relative" ref={periodMenuRef}>
            <button
              type="button"
              onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
              aria-expanded={isPeriodMenuOpen}
              aria-haspopup="listbox"
              aria-label={`Período selecionado: ${activePeriodLabel}. Clique para alterar o intervalo de tempo`}
              className={`inline-flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs transition-colors cursor-pointer min-w-[230px] sm:min-w-[260px] ${
                isPeriodMenuOpen
                  ? "border-[#D4AF37] bg-[#1F1F1F] text-white"
                  : "border-white/15 bg-[#1C1C1C] text-white hover:border-white/30"
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-zinc-400">Período:</span>
                <strong className="font-semibold text-white truncate">
                  {activePeriodLabel}
                </strong>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-150 ${
                  isPeriodMenuOpen ? "rotate-180 text-[#D4AF37]" : ""
                }`}
              />
            </button>

            {/* Dropdown Popover estilo Kommo */}
            {isPeriodMenuOpen && (
              <div
                role="listbox"
                aria-label="Selecionar intervalo de tempo"
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border border-white/15 bg-[#161616] shadow-2xl overflow-hidden animate-in fade-in duration-100"
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-[#1C1C1C] px-3.5 py-2.5 text-[11px] text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Intervalo de tempo
                  </span>
                  {dateIntervalLabel && (
                    <span className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                      {dateIntervalLabel}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-white/[0.06] max-h-80 overflow-y-auto">
                  {quickPeriods.map((opt) => {
                    const active = effectiveFilter.period === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => handleQuickPeriodClick(opt.key)}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                          active
                            ? "bg-[#D4AF37]/15 text-[#D4AF37] font-semibold"
                            : "text-zinc-200 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Controles Rápidos: Comparação + Profissional Rápido + Filtros Avançados */}
          <div className="flex flex-wrap items-center gap-2">
            {onApplyFilters && (
              <div className="flex items-center gap-2 bg-[#1C1C1C] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/80">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <label
                  htmlFor="dashboard-compare-mode"
                  className="text-zinc-400 shrink-0"
                >
                  Comparar:
                </label>
                <select
                  id="dashboard-compare-mode"
                  value={effectiveFilter.compareMode}
                  disabled={effectiveFilter.period === "all"}
                  onChange={(e) =>
                    handleCompareModeChange(
                      e.target.value as InsightComparisonMode,
                    )
                  }
                  className="min-h-8 bg-transparent text-white font-semibold focus:outline-none cursor-pointer disabled:opacity-40"
                  aria-label="Selecionar modo de comparação"
                >
                  <option value="none" className="bg-[#1C1C1C] text-white">
                    Sem comparação
                  </option>
                  <option
                    value="prev_period"
                    className="bg-[#1C1C1C] text-white"
                  >
                    Período anterior equivalente
                  </option>
                  <option value="yoy" className="bg-[#1C1C1C] text-white">
                    Mesmo período do ano anterior
                  </option>
                  <option value="custom" className="bg-[#1C1C1C] text-white">
                    Intervalo personalizado
                  </option>
                </select>
              </div>
            )}

            {/* Seletor rápido de barbeiro único quando não há multisseleção */}
            <div className="flex items-center gap-2 bg-[#1C1C1C] px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/80">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <label
                htmlFor="dashboard-barber-filter"
                className="text-zinc-400 shrink-0"
              >
                Equipe:
              </label>
              <select
                id="dashboard-barber-filter"
                value={
                  effectiveFilter.barberIds.length === 1
                    ? effectiveFilter.barberIds[0]
                    : effectiveFilter.barberIds.length > 1
                      ? "__multi__"
                      : "all"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__multi__") return;
                  if (onApplyFilters) {
                    onApplyFilters({
                      ...effectiveFilter,
                      barberIds: val === "all" ? [] : [val],
                    });
                  } else {
                    onBarberChange(val);
                  }
                }}
                className="min-h-8 max-w-full bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                aria-label="Filtrar por profissional"
              >
                <option value="all" className="bg-[#1C1C1C] text-white">
                  Todos os Barbeiros
                </option>
                {effectiveFilter.barberIds.length > 1 && (
                  <option value="__multi__" className="bg-[#1C1C1C] text-white">
                    {effectiveFilter.barberIds.length} profissionais selecionados
                  </option>
                )}
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

            {onApplyFilters && (
              <button
                type="button"
                onClick={openAdvancedPanel}
                className={`inline-flex min-h-10 items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeFilterCount > 0
                    ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "bg-[#1C1C1C] border-white/10 text-zinc-200 hover:border-white/25"
                }`}
                aria-expanded={isAdvancedOpen}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros avançados</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-black text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Intervalo Personalizado de Período ou Comparação */}
        {onApplyFilters &&
          (effectiveFilter.period === "custom" ||
            effectiveFilter.compareMode === "custom") && (
            <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-[#1C1C1C] border border-white/10 text-xs">
              {effectiveFilter.period === "custom" && (
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label
                      htmlFor="custom-period-start"
                      className="block text-[11px] text-zinc-400 mb-1"
                    >
                      Início do período
                    </label>
                    <input
                      id="custom-period-start"
                      type="date"
                      value={customStartDraft}
                      onChange={(e) => setCustomStartDraft(e.target.value)}
                      className="min-h-9 rounded-lg bg-[#121212] border border-white/15 px-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-period-end"
                      className="block text-[11px] text-zinc-400 mb-1"
                    >
                      Fim do período
                    </label>
                    <input
                      id="custom-period-end"
                      type="date"
                      value={customEndDraft}
                      onChange={(e) => setCustomEndDraft(e.target.value)}
                      className="min-h-9 rounded-lg bg-[#121212] border border-white/15 px-2.5 text-white"
                    />
                  </div>
                </div>
              )}

              {effectiveFilter.compareMode === "custom" && (
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label
                      htmlFor="custom-compare-start"
                      className="block text-[11px] text-[#D4AF37] mb-1"
                    >
                      Início da comparação
                    </label>
                    <input
                      id="custom-compare-start"
                      type="date"
                      value={compareStartDraft}
                      onChange={(e) => setCompareStartDraft(e.target.value)}
                      className="min-h-9 rounded-lg bg-[#121212] border border-[#D4AF37]/30 px-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-compare-end"
                      className="block text-[11px] text-[#D4AF37] mb-1"
                    >
                      Fim da comparação
                    </label>
                    <input
                      id="custom-compare-end"
                      type="date"
                      value={compareEndDraft}
                      onChange={(e) => setCompareEndDraft(e.target.value)}
                      className="min-h-9 rounded-lg bg-[#121212] border border-[#D4AF37]/30 px-2.5 text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onApplyFilters({
                    ...effectiveFilter,
                    customStart: customStartDraft,
                    customEnd: customEndDraft,
                    compareStart: compareStartDraft,
                    compareEnd: compareEndDraft,
                  })
                }
                className="min-h-9 px-3.5 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#e0bc42] transition-colors cursor-pointer"
              >
                Aplicar datas
              </button>
            </div>
          )}

        {/* Chips removíveis dos filtros ativos */}
        {onApplyFilters && activeFilterCount > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 pt-1"
            aria-label="Filtros ativos"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Filtros ativos:
            </span>
            {effectiveFilter.compareMode !== "none" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-1 text-xs text-[#D4AF37]">
                Comparação:{" "}
                {effectiveFilter.compareMode === "prev_period"
                  ? "Período anterior"
                  : effectiveFilter.compareMode === "yoy"
                    ? "Ano anterior (YoY)"
                    : "Personalizada"}
                <button
                  type="button"
                  onClick={() => removeChip({ compareMode: "none" })}
                  className="hover:text-white cursor-pointer"
                  aria-label="Remover comparação"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {effectiveFilter.barberIds.map((id) => {
              const barber = barbers.find((b) => b.id === id);
              return (
                <span
                  key={`barber-${id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/15 px-2.5 py-1 text-xs text-zinc-200"
                >
                  Profissional: {barber?.name || id}
                  <button
                    type="button"
                    onClick={() =>
                      removeChip({
                        barberIds: effectiveFilter.barberIds.filter(
                          (item) => item !== id,
                        ),
                      })
                    }
                    className="text-zinc-400 hover:text-white cursor-pointer"
                    aria-label={`Remover filtro do profissional ${barber?.name || id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {effectiveFilter.serviceIds.map((id) => {
              const svc = services.find((s) => s.id === id);
              return (
                <span
                  key={`service-${id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/15 px-2.5 py-1 text-xs text-zinc-200"
                >
                  Serviço: {svc?.name || id}
                  <button
                    type="button"
                    onClick={() =>
                      removeChip({
                        serviceIds: effectiveFilter.serviceIds.filter(
                          (item) => item !== id,
                        ),
                      })
                    }
                    className="text-zinc-400 hover:text-white cursor-pointer"
                    aria-label={`Remover filtro do serviço ${svc?.name || id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {effectiveFilter.origins.map((origin) => {
              const label =
                ORIGIN_OPTIONS.find((o) => o.key === origin)?.label || origin;
              return (
                <span
                  key={`origin-${origin}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/15 px-2.5 py-1 text-xs text-zinc-200"
                >
                  Origem: {label}
                  <button
                    type="button"
                    onClick={() =>
                      removeChip({
                        origins: effectiveFilter.origins.filter(
                          (item) => item !== origin,
                        ),
                      })
                    }
                    className="text-zinc-400 hover:text-white cursor-pointer"
                    aria-label={`Remover filtro de origem ${label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {effectiveFilter.paymentMethods.map((method) => {
              const label =
                PAYMENT_METHOD_OPTIONS.find((m) => m.key === method)?.label ||
                method;
              return (
                <span
                  key={`pm-${method}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 border border-sky-500/35 px-2.5 py-1 text-xs text-sky-200"
                >
                  Caixa: {label}
                  <button
                    type="button"
                    onClick={() =>
                      removeChip({
                        paymentMethods: effectiveFilter.paymentMethods.filter(
                          (item) => item !== method,
                        ),
                      })
                    }
                    className="text-sky-300 hover:text-white cursor-pointer"
                    aria-label={`Remover filtro de pagamento ${label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline px-2 py-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal/Painel de Filtros Avançados (multisseleção em lote com Aplicar / Cancelar / Limpar) */}
      {isAdvancedOpen && onApplyFilters && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsAdvancedOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="advanced-filters-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#121212] p-6 text-white shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2
                  id="advanced-filters-title"
                  className="text-lg font-bold text-white"
                >
                  Filtros Avançados e Comparação
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dentro de cada dimensão, múltiplas opções usam OU; entre
                  dimensões diferentes, usam E. A consulta só é disparada ao
                  clicar em &ldquo;Aplicar filtros&rdquo;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(false)}
                className="rounded-lg border border-white/15 p-2 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Fechar filtros avançados"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profissionais */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Profissionais ({draft.barberIds.length || "Todos"})
                </span>
                {draft.barberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, barberIds: [] })}
                    className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Selecionar todos
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {barbers.map((b) => {
                  const checked = draft.barberIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          barberIds: toggleItem(draft.barberIds, b.id),
                        })
                      }
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        checked
                          ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white font-semibold"
                          : "border-white/10 bg-[#181818] text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      <span className="truncate">
                        {b.name}
                        {b.active === false ? " (Inativo)" : ""}
                      </span>
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Serviços */}
            {services.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Serviços ({draft.serviceIds.length || "Todos"})
                  </span>
                  {draft.serviceIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, serviceIds: [] })}
                      className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Selecionar todos
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {services.map((s) => {
                    const checked = draft.serviceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            serviceIds: toggleItem(draft.serviceIds, s.id),
                          })
                        }
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          checked
                            ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white font-semibold"
                            : "border-white/10 bg-[#181818] text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <span className="truncate">
                          {s.name}
                          {!s.active ? " (Inativo)" : ""}
                        </span>
                        {checked && (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Origem do Agendamento */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Origem do Agendamento ({draft.origins.length || "Todas"})
                </span>
                {draft.origins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, origins: [] })}
                    className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Selecionar todas
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ORIGIN_OPTIONS.map((opt) => {
                  const checked = draft.origins.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          origins: toggleItem(draft.origins, opt.key),
                        })
                      }
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        checked
                          ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white font-semibold"
                          : "border-white/10 bg-[#181818] text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forma de Pagamento (Caixa) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Forma de Pagamento no Caixa (
                    {draft.paymentMethods.length || "Todas"})
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Aplica-se aos recebimentos confirmados; não filtra serviços
                    sem pagamento.
                  </p>
                </div>
                {draft.paymentMethods.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, paymentMethods: [] })}
                    className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Selecionar todas
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PAYMENT_METHOD_OPTIONS.map((opt) => {
                  const checked = draft.paymentMethods.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          paymentMethods: toggleItem(
                            draft.paymentMethods,
                            opt.key,
                          ),
                        })
                      }
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        checked
                          ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white font-semibold"
                          : "border-white/10 bg-[#181818] text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações do Modal: Limpar, Cancelar, Aplicar filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    period: "month",
                    customStart: "",
                    customEnd: "",
                    compareMode: "none",
                    compareStart: "",
                    compareEnd: "",
                    barberIds: [],
                    serviceIds: [],
                    origins: [],
                    paymentMethods: [],
                  })
                }
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/10 px-3.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar seleção
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(false)}
                  className="min-h-10 rounded-xl border border-white/15 px-4 text-xs font-semibold text-zinc-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyFilters(draft);
                    setIsAdvancedOpen(false);
                  }}
                  className="min-h-10 rounded-xl bg-[#D4AF37] px-5 text-xs font-bold text-black hover:bg-[#e0bc42] cursor-pointer"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

