"use client";

import {
  createScheduleExceptionAction,
  deleteScheduleExceptionAction,
  getPhaseP3WorkspaceAction,
  linkClientContactToUserAction,
  unlinkClientContactAction,
} from "@/app/actions/operations-actions";
import type { DashboardPeriod } from "@/components/admin/dashboard-types";
import { insightMoney as money } from "@/components/admin/InsightDetailsDialog";
import type { PhaseP3WorkspaceData } from "@/infra/repositories/PrismaOperationsCapacityRepository";
import type { ScheduleExceptionKind } from "@/core/utils/operations-retention-capacity";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  Link2,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Unlink,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const moneyCents = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "—" : money(cents);

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const todayInputDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function PhaseP3OperationsPanel({
  period,
  barberId,
  barberIds,
  serviceIds,
  origins,
  customStart,
  customEnd,
}: {
  period: DashboardPeriod;
  barberId?: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: string[];
  customStart?: string;
  customEnd?: string;
}) {
  const [workspace, setWorkspace] = useState<PhaseP3WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Exception Form State
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exBarberId, setExBarberId] = useState("");
  const [exKind, setExKind] = useState<ScheduleExceptionKind>("PAUSE");
  const [exDate, setExDate] = useState(todayInputDate);
  const [exStartHHMM, setExStartHHMM] = useState("12:00");
  const [exEndHHMM, setExEndHHMM] = useState("13:00");
  const [exReason, setExReason] = useState("");
  const [exSubmitting, setExSubmitting] = useState(false);

  // Canonical Identity Link State
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkReason, setLinkReason] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const reqSeq = useRef(0);

  const barbersKey = (barberIds ?? []).join(",");
  const servicesKey = (serviceIds ?? []).join(",");
  const originsKey = (origins ?? []).join(",");

  const loadWorkspace = useCallback(async () => {
    const seq = ++reqSeq.current;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await getPhaseP3WorkspaceAction({
        period,
        barberId,
        barberIds,
        serviceIds,
        origins,
        customStart,
        customEnd,
      });

      if (seq !== reqSeq.current) return;

      if (res.success && res.workspace) {
        setWorkspace(res.workspace);
      } else {
        setErrorMsg(
          res.error ||
            "Não foi possível carregar os dados de capacidade e retenção."
        );
      }
    } catch {
      if (seq !== reqSeq.current) return;
      setErrorMsg("Falha ao carregar indicadores operacionais da Fase P3.");
    } finally {
      if (seq === reqSeq.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    period,
    barberId,
    barbersKey,
    servicesKey,
    originsKey,
    customStart,
    customEnd,
  ]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);
    setExSubmitting(true);
    try {
      const res = await createScheduleExceptionAction({
        barberId: exBarberId,
        kind: exKind,
        date: exDate,
        startTimeHHMM: exStartHHMM,
        endTimeHHMM: exEndHHMM,
        reason: exReason || undefined,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Erro ao registrar exceção de jornada.");
      } else {
        setFeedbackMsg(
          "Exceção de jornada registrada! A capacidade disponível e as taxas de ocupação foram recalculadas."
        );
        setExReason("");
        setShowExceptionForm(false);
        await loadWorkspace();
      }
    } finally {
      setExSubmitting(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    const res = await deleteScheduleExceptionAction(id);
    if (!res.success) {
      setErrorMsg(res.error || "Erro ao remover exceção.");
    } else {
      setFeedbackMsg("Exceção de jornada removida.");
      await loadWorkspace();
    }
  };

  const handleCreateIdentityLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedbackMsg(null);
    setLinkSubmitting(true);
    try {
      const res = await linkClientContactToUserAction({
        clientContactId: selectedContactId,
        canonicalUserId: selectedUserId,
        reason: linkReason || undefined,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Erro ao vincular identidade.");
      } else {
        setFeedbackMsg(
          "Vínculo canônico registrado com sucesso! O histórico de visitas do contato manual agora é unificado à conta do cliente."
        );
        setSelectedContactId("");
        setSelectedUserId("");
        setLinkReason("");
        setShowLinkForm(false);
        await loadWorkspace();
      }
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleUnlinkContact = async (clientContactId: string) => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    const res = await unlinkClientContactAction(clientContactId);
    if (!res.success) {
      setErrorMsg(res.error || "Erro ao desvincular contato.");
    } else {
      setFeedbackMsg(
        "Vínculo desfeito. As identidades voltaram a ser contabilizadas separadamente."
      );
      await loadWorkspace();
    }
  };

  if (loading && !workspace) {
    return (
      <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#141414] p-6">
        <div className="h-6 w-64 animate-pulse rounded bg-white/10" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      </section>
    );
  }

  const report = workspace?.report;
  if (!report) return null;

  const { teamCapacity, heatmap, cancellations, retention } = report;
  const hoursRange = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const weekdaysRange = [
    { w: 0, label: "Dom" },
    { w: 1, label: "Seg" },
    { w: 2, label: "Ter" },
    { w: 3, label: "Qua" },
    { w: 4, label: "Qui" },
    { w: 5, label: "Sex" },
    { w: 6, label: "Sáb" },
  ];

  return (
    <section
      aria-label="Capacidade Operacional, Ocupação e Retenção de Clientes"
      className="mt-10 space-y-8 border-t border-white/[0.08] pt-10"
    >
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">
            Agenda, Horários Livres e Fidelidade dos Clientes
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            Ocupação da Agenda, Horários de Pico e Retorno de Clientes
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-zinc-400">
            Veja quanto tempo da agenda dos barbeiros está preenchido, quais
            horários ficam vazios, quantas vagas canceladas foram salvas por
            outro cliente e quantos clientes novos voltam em até 30 dias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExceptionForm((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {showExceptionForm
              ? "Fechar Horário de Pausa / Folga"
              : "Cadastrar Almoço / Folga / Horário Extra"}
          </button>

          <button
            type="button"
            onClick={() => setShowLinkForm((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-zinc-200 hover:border-amber-500/30 hover:text-amber-200"
          >
            <Link2 className="h-3.5 w-3.5 text-amber-400" />
            {showLinkForm
              ? "Fechar Unificação de Ficha"
              : "Unir Ficha da Recepção com Conta do Site"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={loadWorkspace}
            className="inline-flex items-center gap-1 font-bold text-red-100 hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Tentar novamente
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold text-emerald-300 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Form: Exceção de Jornada */}
      {showExceptionForm && (
        <div className="rounded-2xl border border-amber-500/30 bg-[#141414] p-5">
          <h3 className="text-sm font-bold text-white">
            Cadastrar Almoço, Saída, Folga ou Horário Extra do Barbeiro
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Almoços e folgas são descontados do tempo disponível do barbeiro
            para não contar como cadeira vazia injustamente.
          </p>

          <form
            onSubmit={handleCreateException}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Profissional *
              </label>
              <select
                required
                value={exBarberId}
                onChange={(e) => setExBarberId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              >
                <option value="">Selecione...</option>
                {teamCapacity.barbers.map((b) => (
                  <option key={b.barberId} value={b.barberId}>
                    {b.barberName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Tipo de Horário *
              </label>
              <select
                value={exKind}
                onChange={(e) =>
                  setExKind(e.target.value as ScheduleExceptionKind)
                }
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              >
                <option value="PAUSE">Pausa / Almoço</option>
                <option value="BLOCK">Saída / Compromisso</option>
                <option value="VACATION">Folga / Férias / Falta</option>
                <option value="EXTRA_SHIFT">Horário Extra (+ Tempo)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Data *
              </label>
              <input
                type="date"
                required
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Início (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={exStartHHMM}
                onChange={(e) => setExStartHHMM(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Fim (HH:MM) *
              </label>
              <input
                type="time"
                required
                value={exEndHHMM}
                onChange={(e) => setExEndHHMM(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={exSubmitting}
                className="w-full rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
              >
                {exSubmitting ? "Salvando..." : "Salvar Horário"}
              </button>
            </div>
          </form>

          {(workspace?.exceptions ?? []).length > 0 && (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <p className="text-[11px] font-bold uppercase text-zinc-400">
                Pausas, folgas e horários extras cadastrados ({workspace!.exceptions.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {workspace!.exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c0c0c] px-2.5 py-1 text-xs text-zinc-300"
                  >
                    <span className="font-bold text-amber-300">{ex.kind}</span>
                    <span>{ex.barberName}</span>
                    <span className="text-zinc-500">
                      {new Date(ex.startTime).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteException(ex.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form: Vinculação Controlada de Identidade Canônica */}
      {showLinkForm && (
        <div className="rounded-2xl border border-sky-500/30 bg-[#141414] p-5">
          <h3 className="text-sm font-bold text-white">
            Unir Ficha da Recepção (WhatsApp/Balcão) com Conta do Site
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Se um cliente agendava pelo WhatsApp e depois criou conta no site,
            vincule os dois aqui para juntar todo o histórico de visitas dele.
          </p>

          <form
            onSubmit={handleCreateIdentityLink}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Ficha da Recepção (WhatsApp / Balcão) *
              </label>
              <select
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              >
                <option value="">Selecione a ficha da recepção...</option>
                {(workspace?.unlinkedContacts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Conta Criada pelo Cliente no Site *
              </label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              >
                <option value="">Selecione a conta do site...</option>
                {(workspace?.registeredClients ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-zinc-300">
                Como você confirmou que é a mesma pessoa?
              </label>
              <input
                type="text"
                placeholder="Ex.: Mesmo celular confirmado no balcão"
                value={linkReason}
                onChange={(e) => setLinkReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={linkSubmitting}
                className="w-full rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-black hover:bg-sky-400 disabled:opacity-50"
              >
                {linkSubmitting ? "Unindo..." : "Confirmar que é o Mesmo Cliente"}
              </button>
            </div>
          </form>

          {(workspace?.identityLinks ?? []).length > 0 && (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <p className="text-[11px] font-bold uppercase text-zinc-400">
                Clientes já unificados ({workspace!.identityLinks.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {workspace!.identityLinks.map((lk) => (
                  <div
                    key={lk.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c0c0c] px-3 py-1.5 text-xs text-zinc-200"
                  >
                    <span className="text-zinc-400">Ficha:</span>
                    <span className="font-semibold text-white">
                      {lk.contactName}
                    </span>
                    <span className="text-amber-400">→</span>
                    <span className="font-semibold text-emerald-300">
                      {lk.canonicalUserName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnlinkContact(lk.clientContactId)}
                      className="ml-1 inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                      title="Separar novamente"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Cards de Capacidade, Ocupação e Produtividade por Hora */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Agenda Preenchida (Agendados)</span>
            <CalendarClock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {teamCapacity.teamScheduledOccupancyRate !== null
              ? `${teamCapacity.teamScheduledOccupancyRate.toLocaleString("pt-BR")}%`
              : "Sem expediente"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Marcado: {formatMinutes(teamCapacity.totalScheduledMinutes)} de{" "}
            {formatMinutes(teamCapacity.totalAvailableMinutes)} livres
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Tempo Cortando (Concluídos)</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-400">
            {teamCapacity.teamCompletedOccupancyRate !== null
              ? `${teamCapacity.teamCompletedOccupancyRate.toLocaleString("pt-BR")}%`
              : "Sem expediente"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Tempo em atendimento:{" "}
            {formatMinutes(teamCapacity.totalCompletedMinutes)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Faturamento por Hora Disponível</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {moneyCents(teamCapacity.teamRealizedPerAvailableHourCents)}
            <span className="text-xs font-normal text-zinc-500"> /hora</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ganho da casa por hora cortando:{" "}
            <strong className="text-amber-300">
              {moneyCents(teamCapacity.teamContributionPerOccupiedHourCents)}/h
            </strong>
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Clientes que Voltam em até 30 Dias</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-sky-400">
            {retention.consolidatedRetention30dRate !== null
              ? `${retention.consolidatedRetention30dRate.toLocaleString("pt-BR")}%`
              : "Aguardando 30 dias"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {retention.consolidatedReturned30dCount} voltaram de{" "}
            {retention.consolidatedMatureClientsCount} clientes já há +30 dias
          </p>
        </div>
      </div>

      {/* 2. Tabela de Capacidade e Produtividade por Barbeiro */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Expediente vs. Tempo Atendendo
            </span>
            <h3 className="mt-0.5 text-base font-bold text-white">
              Aproveitamento do Tempo e Ganho por Hora de Cada Barbeiro
            </h3>
          </div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
            Calculado pelo tempo de cada serviço na agenda
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400">
                <th className="pb-2.5 pr-3">Profissional</th>
                <th className="pb-2.5 px-2 text-right">Tempo Disponível</th>
                <th className="pb-2.5 px-2 text-right">Tempo Agendado</th>
                <th className="pb-2.5 px-2 text-right">Tempo Cortando</th>
                <th className="pb-2.5 px-2 text-right">% Agenda Cheia</th>
                <th className="pb-2.5 px-2 text-right">% Tempo Cortando</th>
                <th className="pb-2.5 px-2 text-right text-amber-300">
                  Cortado / Hora Livre
                </th>
                <th className="pb-2.5 px-2 text-right text-emerald-300">
                  Parte da Casa / Hora
                </th>
                <th className="pb-2.5 pl-2 text-right">
                  Cancelados (Salvo / Perdido)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {teamCapacity.barbers.map((b) => (
                <tr key={b.barberId} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-3 font-semibold text-white">
                    {b.barberName}
                    {!b.active && (
                      <span className="ml-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        Inativo
                      </span>
                    )}
                    {!b.hasConfiguredSchedule && (
                      <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                        Sem expediente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatMinutes(b.availableMinutes)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatMinutes(b.scheduledMinutes)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300">
                    {formatMinutes(b.completedMinutes)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-white">
                    {b.scheduledOccupancyRate !== null
                      ? `${b.scheduledOccupancyRate.toLocaleString("pt-BR")}%`
                      : "N/A"}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-emerald-400">
                    {b.completedOccupancyRate !== null
                      ? `${b.completedOccupancyRate.toLocaleString("pt-BR")}%`
                      : "N/A"}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-amber-300">
                    {moneyCents(b.realizedPerAvailableHourCents)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-emerald-300">
                    {moneyCents(b.contributionPerOccupiedHourCents)}
                  </td>
                  <td className="py-3 pl-2 text-right text-zinc-400">
                    {formatMinutes(b.canceledMinutes)} (
                    <span className="text-emerald-300">
                      {formatMinutes(b.reusedCanceledMinutes)} salvo
                    </span>{" "}
                    /{" "}
                    <span className="text-red-300">
                      {formatMinutes(b.effectivelyLostMinutes)} perdido
                    </span>
                    )
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Mapa de Calor de Ocupação (Dia da Semana x Hora) e Cancelamentos/Faltas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Heatmap */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 lg:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            Horários de Pico vs. Horários Vazios
          </span>
          <h3 className="mt-0.5 text-base font-bold text-white">
            Movimento da Agenda por Dia da Semana e Hora
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Veja em quais dias e horários as cadeiras ficam mais cheias (dourado)
            ou mais vazias (ótimo para criar promoções).
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400">
                  <th className="py-2 pr-2 text-left">Dia</th>
                  {hoursRange.map((h) => (
                    <th key={h} className="px-1 py-2">
                      {h}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {weekdaysRange.map(({ w, label }) => (
                  <tr key={w}>
                    <td className="py-2 pr-2 text-left font-bold text-zinc-300">
                      {label}
                    </td>
                    {hoursRange.map((h) => {
                      const slot = heatmap.find(
                        (s) => s.weekday === w && s.hour === h
                      );
                      const rate = slot?.occupancyRate ?? null;
                      let bg = "bg-white/[0.02] text-zinc-600";
                      if (rate !== null) {
                        if (rate >= 75) {
                          bg =
                            "bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40";
                        } else if (rate >= 40) {
                          bg = "bg-amber-500/15 text-amber-300 font-semibold";
                        } else if (rate > 0) {
                          bg = "bg-emerald-500/10 text-emerald-300";
                        } else {
                          bg = "bg-white/[0.04] text-zinc-400";
                        }
                      }
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            className={`rounded-md py-1.5 text-[10px] ${bg}`}
                            title={
                              slot
                                ? `${label} ${h}h: ${slot.occupiedMinutes}min ocupados / ${slot.availableMinutes}min disponíveis`
                                : ""
                            }
                          >
                            {rate !== null ? `${Math.round(rate)}%` : "—"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancelamentos, Faltas e Tempo Reaproveitado */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <h3 className="text-base font-bold text-white">
              Desmarcações, Faltas e Horários Salvos
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Calculado sobre {cancellations.eligibleTerminalCount} horários que
            já passaram (sem contar {cancellations.futureExcludedCount}{" "}
            agendamentos futuros).
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                % de Desmarcações
              </span>
              <p className="mt-1 text-lg font-bold text-amber-300">
                {cancellations.cancellationRate !== null
                  ? `${cancellations.cancellationRate.toLocaleString("pt-BR")}%`
                  : "—"}
              </p>
              <p className="text-[11px] text-zinc-500">
                {cancellations.canceledTerminalCount} desmarcado(s)
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                % de Faltas (Não veio)
              </span>
              <p className="mt-1 text-lg font-bold text-red-400">
                {cancellations.noShowRate !== null
                  ? `${cancellations.noShowRate.toLocaleString("pt-BR")}%`
                  : "—"}
              </p>
              <p className="text-[11px] text-zinc-500">
                {cancellations.noShowTerminalCount} falta(s)
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#101010] p-3.5 text-xs">
            <p className="font-semibold text-white">
              Horários Desmarcados: Perdemos ou Encaixamos Outro Cliente?
            </p>
            <div className="mt-2 space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Tempo total de cortes desmarcados:</span>
                <span className="font-bold text-zinc-200">
                  {formatMinutes(cancellations.totalCanceledMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Salvo por outro cliente encaixado no lugar:</span>
                <span className="font-bold text-emerald-400">
                  {formatMinutes(cancellations.reusedCanceledMinutes)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/[0.05] pt-1.5">
                <span className="text-zinc-200">
                  Tempo que realmente ficou vazio:
                </span>
                <span className="font-bold text-red-400">
                  {formatMinutes(cancellations.effectivelyLostMinutes)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-bold uppercase text-zinc-400">
              Onde Mais Desmarcam ou Faltam
            </p>
            {cancellations.byOrigin.map((orig) => (
              <div
                key={orig.origin}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#101010] px-3 py-2 text-xs"
              >
                <span className="text-zinc-300">{orig.label}</span>
                <span className="text-zinc-400">
                  {orig.canceledCount} desm. · {orig.noShowCount} faltas (
                  <strong className="text-white">
                    {orig.lossRate !== null ? `${orig.lossRate}%` : "—"}
                  </strong>
                  )
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Coortes de Retenção de 30 Dias e Novos vs Retornantes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 lg:col-span-2">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                Fidelidade de Clientes Novos · Prazo de 30 Dias
              </span>
              <h3 className="mt-0.5 text-base font-bold text-white">
                Quantos Clientes Novos Voltaram para Cortar em até 30 Dias
              </h3>
            </div>
            <span className="text-xs text-zinc-400">
              Tempo médio entre um corte e outro:{" "}
              <strong className="text-white">
                {retention.globalAvgReturnIntervalDays !== null
                  ? `a cada ${retention.globalAvgReturnIntervalDays.toLocaleString("pt-BR")} dias`
                  : "Ainda sem histórico suficiente"}
              </strong>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                Total de Clientes no Período
              </span>
              <p className="mt-1 text-lg font-bold text-white">
                {retention.activeClientsInPeriodCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                Clientes Novos (1ª Vez na Loja)
              </span>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {retention.newClientsInPeriodCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                Clientes Antigos que Voltaram
              </span>
              <p className="mt-1 text-lg font-bold text-sky-400">
                {retention.returningClientsInPeriodCount}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#101010] p-3">
              <span className="text-[11px] text-zinc-400">
                Vieram 2x ou Mais no Período
              </span>
              <p className="mt-1 text-lg font-bold text-amber-400">
                {retention.recurringInPeriodCount}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400">
                  <th className="pb-2.5 pr-3">Mês da 1ª Visita</th>
                  <th className="pb-2.5 px-2 text-right">Clientes Novos</th>
                  <th className="pb-2.5 px-2 text-right">Já têm +30 dias</th>
                  <th className="pb-2.5 px-2 text-right">Ainda têm &lt;30 dias</th>
                  <th className="pb-2.5 px-2 text-right">
                    Voltaram em até 30d
                  </th>
                  <th className="pb-2.5 px-2 text-right">% que Voltou</th>
                  <th className="pb-2.5 pl-2">Situação do Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {retention.cohorts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-xs text-zinc-500"
                    >
                      Nenhum cliente novo com corte concluído ainda.
                    </td>
                  </tr>
                ) : (
                  retention.cohorts.map((c) => (
                    <tr key={c.cohortMonth} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 font-bold text-white">
                        {c.cohortMonth}
                      </td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">
                        {c.totalNewClients}
                      </td>
                      <td className="py-2.5 px-2 text-right text-zinc-300">
                        {c.matureClientsCount}
                      </td>
                      <td className="py-2.5 px-2 text-right text-amber-300">
                        {c.immatureClientsCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-400">
                        {c.returnedWithin30dCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-sky-300">
                        {c.retention30dRate !== null
                          ? `${c.retention30dRate.toLocaleString("pt-BR")}%`
                          : "—"}
                      </td>
                      <td className="py-2.5 pl-2 text-[11px] text-zinc-400">
                        {c.statusNote}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clientes sem retorno há 30/60/90+ dias & Aviso de Identidades */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Clientes Sumidos (Tempo Sem Cortar)
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Clientes ordenados por quantos dias faz desde o último corte
            concluído na barbearia.
          </p>

          <div className="mt-4 space-y-3">
            {retention.daysWithoutReturnBuckets.map((b) => (
              <div
                key={b.bucket}
                className="rounded-xl border border-white/[0.05] bg-[#101010] p-3.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{b.bucket}</span>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    {b.count} cliente(s)
                  </span>
                </div>
                {b.clients.length > 0 && (
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
                    {b.clients.slice(0, 3).map((cl) => (
                      <div
                        key={cl.canonicalKey}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate pr-2 text-zinc-300">
                          {cl.displayName}
                        </span>
                        <span className="shrink-0 text-zinc-500">
                          há {cl.daysSinceLastVisit}d ·{" "}
                          {moneyCents(cl.historicalRealizedCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3.5 text-xs text-zinc-300">
            <p className="font-bold text-sky-300">
              Fichas da Recepção vs. Contas do Site
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Fichas separadas da recepção:{" "}
              <strong className="text-white">
                {retention.separateContactIdentitiesCount}
              </strong>{" "}
              · Fichas já unidas a contas do site:{" "}
              <strong className="text-emerald-300">
                {retention.linkedIdentitiesCount}
              </strong>
              . Clientes com o mesmo nome nunca são misturados sozinhos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
