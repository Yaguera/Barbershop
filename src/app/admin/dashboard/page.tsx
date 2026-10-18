"use client";

import { getBarbersAction } from "@/app/actions/admin-actions";
import { getAdminInsightsAction } from "@/app/actions/admin-insights-actions";
import type { AdminInsights } from "@/core/domain/repositories/AdminInsightsRepository";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import type {
  AdminBarberProp,
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
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter from URL params or default to current month
  const paramPeriod =
    (searchParams.get("period") as DashboardPeriod) || "month";
  const paramBarber = searchParams.get("barber") || "all";

  const period: DashboardPeriod = [
    "today",
    "week",
    "month",
    "year",
    "all",
  ].includes(paramPeriod)
    ? paramPeriod
    : "month";
  const selectedBarberId = paramBarber;
  const [analyticsScope, setAnalyticsScope] = useState("");
  // Analytics & Team Filter State
  const [analytics, setAnalytics] = useState<AdminInsights | null>(null);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Sequence ref to discard outdated responses (prevents race conditions)
  const requestIdRef = useRef(0);

  const updateUrlParams = (newPeriod: DashboardPeriod, newBarber: string) => {
    const params = new URLSearchParams();
    if (newPeriod !== "month") params.set("period", newPeriod);
    if (newBarber !== "all") params.set("barber", newBarber);
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
      targetPeriod: DashboardPeriod,
      targetBarber: string,
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
        const [analyticsRes, barbersRes] = await Promise.all([
          getAdminInsightsAction(targetPeriod, targetBarber),
          getBarbersAction(),
        ]);

        // Discard out-of-order response if another filter change was triggered
        if (currentRequestId !== requestIdRef.current) return;

        if (analyticsRes.success && analyticsRes.report) {
          setAnalyticsScope(`${targetPeriod}:${targetBarber}`);
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
    void loadDashboardData(period, selectedBarberId);
  }, [period, selectedBarberId, loadDashboardData]);

  const handlePeriodChange = (newPeriod: DashboardPeriod) =>
    updateUrlParams(newPeriod, selectedBarberId);
  const handleBarberFilterChange = (barberId: string) =>
    updateUrlParams(period, barberId);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30">
      {/* Header */}
      <AdminNavbar activePage="dashboard" />

      {/* Main CRM Analytical Layout */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 space-y-8 max-w-7xl">
        {/* 1 & 2. Título, Contexto e Filtros Consistentes */}
        <DashboardFilters
          period={period}
          selectedBarberId={selectedBarberId}
          barbers={barbers}
          dateIntervalLabel={
            analyticsScope === `${period}:${selectedBarberId}`
              ? analytics?.periodLabel
              : undefined
          }
          lastUpdated={
            analyticsScope === `${period}:${selectedBarberId}`
              ? lastUpdated || undefined
              : undefined
          }
          isRefreshing={isRefreshing}
          onRefresh={() => loadDashboardData(period, selectedBarberId, true)}
          onPeriodChange={handlePeriodChange}
          onBarberChange={handleBarberFilterChange}
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
              onClick={() => loadDashboardData(period, selectedBarberId, true)}
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
        {isLoading ||
        (analytics && analyticsScope !== `${period}:${selectedBarberId}`) ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white/70">
              Carregando métricas...
            </span>
          </div>
        ) : (
          <DashboardAnalytics
            key={`${period}:${selectedBarberId}:${lastUpdated}`}
            analytics={analytics}
            period={period}
            barberId={selectedBarberId}
          />
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

