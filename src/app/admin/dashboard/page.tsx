"use client";

import { getBarbersAction } from "@/app/actions/admin-actions";
import { getAdminInsightsAction } from "@/app/actions/admin-insights-actions";
import { getServicesAdminAction } from "@/app/actions/service-actions";
import type {
  AdminInsights,
  BookingOriginFilter,
  InsightComparisonMode,
  InsightPeriod,
  PaymentMethodFilter,
} from "@/core/domain/repositories/AdminInsightsRepository";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AdminOperationsSection } from "@/components/admin/AdminOperationsSection";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import { PhaseP3OperationsPanel } from "@/components/admin/PhaseP3OperationsPanel";
import { PhaseP4GovernancePanel } from "@/components/admin/PhaseP4GovernancePanel";
import type {
  AdminBarberProp,
  AdminServiceProp,
  DashboardFilterState,
  DashboardPeriod,
} from "@/components/admin/dashboard-types";
import {
  AlertCircle,
  CalendarDays,
  Percent,
  RefreshCw,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const VALID_PERIODS: InsightPeriod[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "prev_month",
  "year",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "custom",
  "all",
];

const VALID_COMPARE_MODES: InsightComparisonMode[] = [
  "none",
  "prev_period",
  "yoy",
  "custom",
];

const VALID_ORIGINS: BookingOriginFilter[] = [
  "ONLINE",
  "WHATSAPP",
  "WALK_IN",
];

const VALID_METHODS: PaymentMethodFilter[] = ["MONEY", "PIX", "CARD"];

function parseFilterStateFromParams(
  searchParams: ReturnType<typeof useSearchParams>,
): DashboardFilterState {
  const rawPeriod = (searchParams.get("period") || "month") as InsightPeriod;
  const period: InsightPeriod = VALID_PERIODS.includes(rawPeriod)
    ? rawPeriod
    : "month";

  const rawCmp = (searchParams.get("cmp") || "none") as InsightComparisonMode;
  const compareMode: InsightComparisonMode = VALID_COMPARE_MODES.includes(
    rawCmp,
  )
    ? rawCmp
    : "none";

  const customStart = searchParams.get("start") || "";
  const customEnd = searchParams.get("end") || "";
  const compareStart = searchParams.get("cmpStart") || "";
  const compareEnd = searchParams.get("cmpEnd") || "";

  const barbersParam =
    searchParams.get("barbers") || searchParams.get("barber") || "";
  const barberIds = barbersParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "all");

  const servicesParam = searchParams.get("services") || "";
  const serviceIds = servicesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const originsParam = searchParams.get("origins") || "";
  const origins = originsParam
    .split(",")
    .map((s) => s.trim() as BookingOriginFilter)
    .filter((s) => VALID_ORIGINS.includes(s));

  const methodsParam = searchParams.get("methods") || "";
  const paymentMethods = methodsParam
    .split(",")
    .map((s) => s.trim() as PaymentMethodFilter)
    .filter((s) => VALID_METHODS.includes(s));

  return {
    period,
    customStart,
    customEnd,
    compareMode: period === "all" ? "none" : compareMode,
    compareStart,
    compareEnd,
    barberIds,
    serviceIds,
    origins,
    paymentMethods,
  };
}

function serializeFilterSignature(f: DashboardFilterState): string {
  return JSON.stringify({
    p: f.period,
    cs: f.customStart,
    ce: f.customEnd,
    cm: f.compareMode,
    cms: f.compareStart,
    cme: f.compareEnd,
    b: [...f.barberIds].sort(),
    s: [...f.serviceIds].sort(),
    o: [...f.origins].sort(),
    m: [...f.paymentMethods].sort(),
  });
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterState = useMemo(
    () => parseFilterStateFromParams(searchParams),
    [searchParams],
  );
  const filterSignature = useMemo(
    () => serializeFilterSignature(filterState),
    [filterState],
  );

  const [analyticsScope, setAnalyticsScope] = useState("");
  const [analytics, setAnalytics] = useState<AdminInsights | null>(null);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [services, setServices] = useState<AdminServiceProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Sequence ref to discard outdated responses (prevents race conditions)
  const requestIdRef = useRef(0);

  const applyFilterStateToUrl = (next: DashboardFilterState) => {
    const params = new URLSearchParams();
    if (next.period !== "month") params.set("period", next.period);
    if (next.period === "custom") {
      if (next.customStart) params.set("start", next.customStart);
      if (next.customEnd) params.set("end", next.customEnd);
    }
    if (next.compareMode !== "none" && next.period !== "all") {
      params.set("cmp", next.compareMode);
      if (next.compareMode === "custom") {
        if (next.compareStart) params.set("cmpStart", next.compareStart);
        if (next.compareEnd) params.set("cmpEnd", next.compareEnd);
      }
    }
    if (next.barberIds.length === 1) {
      params.set("barber", next.barberIds[0]);
    } else if (next.barberIds.length > 1) {
      params.set("barbers", next.barberIds.join(","));
    }
    if (next.serviceIds.length > 0) {
      params.set("services", next.serviceIds.join(","));
    }
    if (next.origins.length > 0) {
      params.set("origins", next.origins.join(","));
    }
    if (next.paymentMethods.length > 0) {
      params.set("methods", next.paymentMethods.join(","));
    }
    const queryString = params.toString();
    router.replace(
      queryString ? `/admin/dashboard?${queryString}` : "/admin/dashboard",
      {
        scroll: false,
      },
    );
  };

  const loadDashboardData = useCallback(
    async (
      targetFilter: DashboardFilterState,
      targetSignature: string,
      isManual = false,
    ) => {
      const currentRequestId = ++requestIdRef.current;

      if (isManual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setAnalytics(null);
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const [analyticsRes, barbersRes, servicesRes] = await Promise.all([
          getAdminInsightsAction({
            period: targetFilter.period,
            customStart: targetFilter.customStart || undefined,
            customEnd: targetFilter.customEnd || undefined,
            compareMode: targetFilter.compareMode,
            compareStart: targetFilter.compareStart || undefined,
            compareEnd: targetFilter.compareEnd || undefined,
            barberIds: targetFilter.barberIds,
            serviceIds: targetFilter.serviceIds,
            origins: targetFilter.origins,
            paymentMethods: targetFilter.paymentMethods,
          }),
          getBarbersAction(),
          getServicesAdminAction(false),
        ]);

        // Discard out-of-order response if another filter change was triggered
        if (currentRequestId !== requestIdRef.current) return;

        if (analyticsRes.success && analyticsRes.report) {
          setAnalyticsScope(targetSignature);
          setAnalytics(analyticsRes.report);
          setErrorMsg(null);
          const serverTimestamp = analyticsRes.report.calculatedAt
            ? new Date(analyticsRes.report.calculatedAt)
            : new Date();
          setLastUpdated(
            serverTimestamp.toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        } else {
          setErrorMsg(
            analyticsRes.error || "Erro ao carregar dados analíticos.",
          );
        }

        if (barbersRes.success && barbersRes.barbers) {
          setBarbers(barbersRes.barbers);
        }
        if (servicesRes.success && servicesRes.services) {
          setServices(servicesRes.services);
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setErrorMsg(
            "Erro inesperado ao buscar dados analíticos. Tente novamente.",
          );
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboardData(filterState, filterSignature);
  }, [filterState, filterSignature, loadDashboardData]);

  const handlePeriodChange = (newPeriod: DashboardPeriod) =>
    applyFilterStateToUrl({ ...filterState, period: newPeriod });
  const handleBarberFilterChange = (barberId: string) =>
    applyFilterStateToUrl({
      ...filterState,
      barberIds: barberId === "all" ? [] : [barberId],
    });
  const handleResetFilters = () =>
    applyFilterStateToUrl({
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
    });

  const selectedBarberId =
    filterState.barberIds.length === 1 ? filterState.barberIds[0] : "all";

  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row selection:bg-[#C5A059]/30">
      {/* Header / Sidebar */}
      <AdminNavbar activePage="dashboard" />

      {/* Main CRM Analytical Layout */}
      <main
        id="main-content"
        className="flex-grow px-4 sm:px-6 py-8 space-y-8 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl"
      >
        {/* 1 & 2. Título, Contexto, Comparação e Filtros Consistentes */}
        <DashboardFilters
          period={filterState.period}
          selectedBarberId={selectedBarberId}
          barbers={barbers}
          services={services}
          filterState={filterState}
          dateIntervalLabel={
            analyticsScope === filterSignature
              ? analytics?.periodLabel
              : undefined
          }
          comparisonIntervalLabel={
            analyticsScope === filterSignature
              ? analytics?.comparison?.periodLabel
              : undefined
          }
          comparisonEquivalenceNote={
            analyticsScope === filterSignature
              ? analytics?.comparison?.equivalenceNote
              : undefined
          }
          lastUpdated={
            analyticsScope === filterSignature
              ? lastUpdated || undefined
              : undefined
          }
          isRefreshing={isRefreshing}
          onRefresh={() =>
            loadDashboardData(filterState, filterSignature, true)
          }
          onPeriodChange={handlePeriodChange}
          onBarberChange={handleBarberFilterChange}
          onApplyFilters={applyFilterStateToUrl}
          onResetFilters={handleResetFilters}
        />

        <nav
          className="flex flex-wrap gap-2.5 text-xs font-medium"
          aria-label="Atalhos de gestão e análise"
        >
          <Link
            href="/admin/calendario"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3.5 text-zinc-300 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <CalendarDays className="size-3.5 text-[#D4AF37]" />
            Calendário & Caixa
          </Link>
          <Link
            href="/admin/financeiro"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3.5 text-zinc-300 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <Wallet className="size-3.5 text-[#D4AF37]" />
            Financeiro & Matriz de métricas
          </Link>
          <Link
            href="/admin/barbeiros"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3.5 text-zinc-300 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <Users className="size-3.5 text-[#D4AF37]" />
            Gerenciar barbeiros
          </Link>
          <Link
            href="/admin/configuracoes/comissoes"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3.5 text-zinc-300 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <Percent className="size-3.5 text-[#D4AF37]" />
            Configurar comissões
          </Link>
          <Link
            href="/admin/configuracoes/permissoes"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3.5 text-zinc-300 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <Shield className="size-3.5 text-[#D4AF37]" />
            Permissões de acesso
          </Link>
        </nav>

        {/* Mensagem de Erro com Ação de Tentar Novamente */}
        {errorMsg && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
            <button
              onClick={() =>
                loadDashboardData(filterState, filterSignature, true)
              }
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Indicador de Atualizando Dados (Overlay sutil durante troca de filtros) */}
        {isRefreshing && !isLoading && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#D4AF37] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Atualizando dados analíticos...</span>
          </div>
        )}

        {/* Estado de Carregamento Inicial */}
        {isLoading || (analytics && analyticsScope !== filterSignature) ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white/70">
              Carregando métricas...
            </span>
          </div>
        ) : (
          <>
            <DashboardAnalytics
              key={`${filterSignature}:${lastUpdated}`}
              analytics={analytics}
              period={filterState.period}
              barberId={selectedBarberId}
              filterState={filterState}
            />
            <AdminOperationsSection
              onOperationComplete={() =>
                void loadDashboardData(filterState, filterSignature, true)
              }
            />
            <PhaseP3OperationsPanel
              period={filterState.period}
              barberId={selectedBarberId}
              barberIds={filterState.barberIds}
              serviceIds={filterState.serviceIds}
              origins={filterState.origins}
              customStart={filterState.customStart || undefined}
              customEnd={filterState.customEnd || undefined}
            />
            <PhaseP4GovernancePanel
              period={filterState.period}
              filterSignature={filterSignature}
              barberId={selectedBarberId}
              barberIds={filterState.barberIds}
              serviceIds={filterState.serviceIds}
              origins={filterState.origins}
              customStart={filterState.customStart || undefined}
              customEnd={filterState.customEnd || undefined}
              receivedRevenueCents={analytics?.receivedCents ?? 0}
              realizedProductionCents={analytics?.realizedCents ?? 0}
              barbershopContributionCents={analytics?.contributionCents ?? 0}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}


