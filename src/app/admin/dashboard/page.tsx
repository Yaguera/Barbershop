"use client";

import {
  deleteBarberAction,
  getBarbersAction,
} from "@/app/actions/admin-actions";
import { getAdminInsightsAction } from "@/app/actions/admin-insights-actions";
import { CommissionSettings } from "@/components/admin/CommissionSettings";
import type { AdminInsights } from "@/core/domain/repositories/AdminInsightsRepository";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import { RegisterBarberForm } from "@/components/admin/RegisterBarberForm";
import type {
  AdminBarberProp,
  DashboardPeriod,
} from "@/components/admin/dashboard-types";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  RefreshCw,
  Trash2,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter from URL params or default
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
  // Analytics & Team State
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
          setErrorMsg(null); // Clear errors on success
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString("pt-BR", {
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

  const handleDeleteBarber = async (barberId: string, barberName: string) => {
    if (
      !confirm(
        `Tem certeza de que deseja desativar o barbeiro ${barberName}? Ele não poderá receber novos agendamentos, mas seu histórico será preservado.`,
      )
    )
      return;

    setIsLoading(true);
    const res = await deleteBarberAction(barberId);
    if (res.success) {
      await loadDashboardData(period, selectedBarberId, true);
    } else {
      setErrorMsg(res.error || "Erro ao desativar barbeiro.");
      setIsLoading(false);
    }
  };

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
          className="flex flex-wrap gap-3 text-sm"
          aria-label="Atalhos do painel"
        >
          <Link
            href="/admin/calendario"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-zinc-300 hover:bg-white/5"
          >
            <CalendarDays className="size-4" />
            Abrir calendário
          </Link>
          <a
            href="#comissoes"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-[#D4AF37]"
          >
            Configurar comissões
          </a>
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
          <div className="space-y-12">
            {/* 3, 4, 5 & 6. Indicadores, Evolução e Serviços */}
            <DashboardAnalytics
              key={`${period}:${selectedBarberId}:${lastUpdated}`}
              analytics={analytics}
              period={period}
              barberId={selectedBarberId}
            />
            <CommissionSettings />

            {/* Seção Separada: Gestão da Equipe de Barbeiros */}
            <section className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#D4AF37]" />
                    Equipe de Barbeiros
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Gerencie profissionais, acesse análises individuais e
                    cadastre novos membros.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista da Equipe */}
                <div className="lg:col-span-2 space-y-4">
                  {barbers.length === 0 ? (
                    <div className="bg-[#151515] border border-white/5 rounded-2xl p-8 text-center text-white/40 text-sm">
                      Nenhum profissional cadastrado na barbearia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {barbers.map((b) => (
                        <div
                          key={b.id}
                          className={`p-4 bg-[#151515] border rounded-2xl flex flex-col justify-between gap-3 transition-colors ${
                            b.active !== false
                              ? "border-white/5 hover:border-white/15"
                              : "border-red-900/30 opacity-70"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            {b.image ? (
                              <Image
                                src={b.image}
                                alt={b.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full border border-white/10 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold flex-shrink-0">
                                {b.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="space-y-1 flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white truncate block leading-tight">
                                  {b.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    b.active !== false
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}
                                >
                                  {b.active !== false ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                              <span className="text-xs text-white/50 block truncate">
                                {b.email}
                              </span>
                              <span className="text-[11px] text-[#D4AF37] font-medium block">
                                {b.specialty ||
                                  "Especialista em Cortes & Barba"}
                              </span>
                              <div className="text-[11px] text-white/40 pt-1">
                                <span className="text-white/60 font-semibold">
                                  Horário:
                                </span>{" "}
                                {b.workStart} - {b.workEnd}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                            <Link
                              href={`/admin/barbeiros/${b.id}/metricas`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-[#D4AF37] border border-white/10 text-xs font-bold transition-colors flex-1 justify-center"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              Desempenho
                            </Link>
                            {b.active !== false && (
                              <button
                                onClick={() => handleDeleteBarber(b.id, b.name)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
                                title="Desativar Barbeiro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Desativar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulário de Registro de Barbeiro */}
                <RegisterBarberForm
                  onRegistered={() =>
                    loadDashboardData(period, selectedBarberId, true)
                  }
                />
              </div>
            </section>
          </div>
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
