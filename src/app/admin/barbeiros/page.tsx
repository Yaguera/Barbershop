'use client';

import {
  deleteBarberAction,
  getBarbersAction,
} from '@/app/actions/admin-actions';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { RegisterBarberForm } from '@/components/admin/RegisterBarberForm';
import type { AdminBarberProp } from '@/components/admin/dashboard-types';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const WEEKDAYS_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AdminBarbeirosPage() {
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de confirmação de desativação
  const [deactivatingBarber, setDeactivatingBarber] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadBarbers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBarbersAction();
      if (res.success && res.barbers) {
        setBarbers(res.barbers);
      } else {
        setErrorMsg(res.error || 'Erro ao carregar equipe de barbeiros.');
      }
    } catch {
      setErrorMsg('Erro inesperado ao buscar barbeiros.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBarbers();
  }, [loadBarbers]);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingBarber) return;
    setIsDeactivating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteBarberAction(deactivatingBarber.id);
      if (res.success) {
        setSuccessMsg(
          res.message ||
            `Profissional ${deactivatingBarber.name} desativado com sucesso. Seu histórico analítico e financeiro permanece preservado.`
        );
        setDeactivatingBarber(null);
        await loadBarbers();
      } else {
        setErrorMsg(res.error || 'Erro ao desativar barbeiro.');
      }
    } catch {
      setErrorMsg('Erro inesperado ao desativar barbeiro.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const activeCount = barbers.filter((b) => b.active !== false).length;
  const inactiveCount = barbers.length - activeCount;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30">
      <AdminNavbar activePage="barbeiros" />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 space-y-6 max-w-7xl">
        {/* Navegação interna de Equipe */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Gestão de Equipe</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Profissionais Barbeiros
            </h1>
            <p className="text-white/60 text-xs sm:text-sm mt-1">
              Cadastre novos profissionais, consulte jornadas, acesse métricas individuais ou desative contas mantendo o histórico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-xl bg-[#151515] p-1 border border-white/10"
              role="navigation"
              aria-label="Subnavegação de equipe"
            >
              <Link
                href="/admin/barbeiros"
                aria-current="page"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-black"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Barbeiros ({barbers.length})
              </Link>
              <Link
                href="/admin/atendentes"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Atendentes
              </Link>
            </div>

            <button
              onClick={() => void loadBarbers()}
              disabled={isLoading}
              className="min-h-11 min-w-11 p-2.5 rounded-xl bg-[#151515] border border-white/10 hover:bg-[#1C1C1C] text-white/80 hover:text-[#D4AF37] transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar lista de barbeiros"
              aria-label="Atualizar lista de barbeiros"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <p>{errorMsg}</p>
            </div>
            <button
              onClick={() => void loadBarbers()}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-200 transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <p>{successMsg}</p>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-300/70 hover:text-emerald-200 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Resumo rápido de equipe */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
            <span className="text-xs text-zinc-400">Total cadastrado</span>
            <strong className="mt-1 block text-2xl font-semibold tabular-nums">
              {barbers.length}
            </strong>
            <span className="mt-1 block text-xs text-zinc-500">
              Profissionais com histórico na barbearia
            </span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
            <span className="text-xs text-zinc-400">Ativos na agenda</span>
            <strong className="mt-1 block text-2xl font-semibold text-emerald-400 tabular-nums">
              {activeCount}
            </strong>
            <span className="mt-1 block text-xs text-zinc-500">
              Disponíveis para novos agendamentos
            </span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
            <span className="text-xs text-zinc-400">Inativos (histórico preservado)</span>
            <strong className="mt-1 block text-2xl font-semibold text-zinc-300 tabular-nums">
              {inactiveCount}
            </strong>
            <span className="mt-1 block text-xs text-zinc-500">
              Mantidos nos relatórios históricos de produção e caixa
            </span>
          </div>
        </div>

        {/* Conteúdo Principal: Lista + Cadastro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#D4AF37]" />
              Equipe Cadastrada
            </h2>

            {isLoading ? (
              <div className="bg-[#151515] border border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center gap-3 text-white/50">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                <span className="text-xs">Carregando profissionais...</span>
              </div>
            ) : barbers.length === 0 ? (
              <div className="bg-[#151515] border border-white/10 rounded-2xl p-8 text-center text-white/50 text-sm">
                Nenhum profissional cadastrado na barbearia. Utilize o formulário ao lado para adicionar o primeiro barbeiro.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {barbers.map((b) => {
                  const isActive = b.active !== false;
                  const daysLabel = Array.isArray(b.workDays)
                    ? b.workDays.map((d) => WEEKDAYS_LABELS[d] || d).join(', ')
                    : '';

                  return (
                    <div
                      key={b.id}
                      className={`p-5 bg-[#151515] border rounded-2xl flex flex-col justify-between gap-4 transition-colors ${
                        isActive
                          ? 'border-white/10 hover:border-white/20'
                          : 'border-red-900/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {b.image ? (
                          <Image
                            src={b.image}
                            alt={b.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#1C1C1C] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1 flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white truncate block leading-tight">
                              {b.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          {b.email && (
                            <span className="text-xs text-white/50 flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 shrink-0 text-white/40" />
                              {b.email}
                            </span>
                          )}
                          <span className="text-xs text-[#D4AF37] font-medium block">
                            {b.specialty || 'Especialista em Cortes & Barba'}
                          </span>
                          <div className="text-xs text-white/50 pt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span>
                              {b.workStart || '09:00'} às {b.workEnd || '18:00'}
                              {daysLabel ? ` · ${daysLabel}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                        <Link
                          href={`/admin/barbeiros/${b.id}/metricas`}
                          className="min-h-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-[#D4AF37] border border-white/10 text-xs font-bold transition-colors flex-1 justify-center"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Métricas e Histórico
                        </Link>
                        {isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeactivatingBarber({ id: b.id, name: b.name })
                            }
                            className="min-h-10 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
                            title={`Desativar ${b.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Desativar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulário de Registro de Barbeiro */}
          <RegisterBarberForm
            onRegistered={() => {
              setSuccessMsg('Novo profissional registrado com sucesso!');
              void loadBarbers();
            }}
          />
        </div>
      </main>

      {/* Modal de confirmação de desativação */}
      {deactivatingBarber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-barber-title"
        >
          <div className="bg-[#151515] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h2 id="deactivate-barber-title" className="font-bold text-base text-white">
                Desativar {deactivatingBarber.name}?
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                O profissional não aparecerá para novos agendamentos e suas sessões ativas serão encerradas. Todo o histórico de atendimentos, valores e comissões permanecerá íntegro nos relatórios.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingBarber(null)}
                disabled={isDeactivating}
                className="min-h-11 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeactivate()}
                disabled={isDeactivating}
                className="min-h-11 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Desativando...</span>
                  </>
                ) : (
                  <span>Confirmar Desativação</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
