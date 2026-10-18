"use client";

import { getBarbersAction } from "@/app/actions/admin-actions";
import {
  cancelExpenseAction,
  createCommissionPayoutAction,
  createExpenseAction,
  getFinancialWorkspaceAction,
  payExpenseAction,
  reverseReceiptWithTypeAction,
} from "@/app/actions/finance-actions";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import {
  InsightDetailsDialog,
  insightMoney as money,
} from "@/components/admin/InsightDetailsDialog";
import type {
  AdminBarberProp,
  DashboardPeriod,
} from "@/components/admin/dashboard-types";
import type { InsightDetailFilter } from "@/core/domain/repositories/AdminInsightsRepository";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryCode,
  type ReversalTypeCode,
} from "@/core/utils/financial-statement";
import type { FinancialWorkspaceData } from "@/infra/repositories/PrismaFinancialLedgerRepository";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Layers,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const moneyCents = (cents: number) => money((cents || 0) / 100);

const formatDateBR = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

const todayInputDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function AdminFinanceiroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramPeriod =
    (searchParams.get("period") as DashboardPeriod) || "month";
  const paramBarber = searchParams.get("barber") || "all";
  const paramStart = searchParams.get("start") || "";
  const paramEnd = searchParams.get("end") || "";

  const validPeriods: DashboardPeriod[] = [
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

  const period: DashboardPeriod = validPeriods.includes(paramPeriod)
    ? paramPeriod
    : "month";

  const [selectedBarberId, setSelectedBarberId] = useState<string>(paramBarber);
  const [barbers, setBarbers] = useState<AdminBarberProp[]>([]);
  const [workspace, setWorkspace] = useState<FinancialWorkspaceData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [detailFilter, setDetailFilter] =
    useState<InsightDetailFilter | null>(null);

  // Form: Nova Despesa
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategoryCode>("RENT");
  const [expDescription, setExpDescription] = useState("");
  const [expSupplier, setExpSupplier] = useState("");
  const [expAmountReais, setExpAmountReais] = useState("");
  const [expCompetenceDate, setExpCompetenceDate] = useState(todayInputDate);
  const [expDueDate, setExpDueDate] = useState(todayInputDate);
  const [expPaidNow, setExpPaidNow] = useState(false);
  const [expPaymentMethod, setExpPaymentMethod] = useState("PIX");
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Modal: Pagar Despesa Pendente
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const [payExpenseMethod, setPayExpenseMethod] = useState("PIX");
  const [payExpenseDate, setPayExpenseDate] = useState(todayInputDate);
  const [payExpenseLoading, setPayExpenseLoading] = useState(false);

  // Modal: Registrar Repasse de Comissão
  const [payoutBarberId, setPayoutBarberId] = useState<string>("");
  const [payoutAmountReais, setPayoutAmountReais] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("PIX");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Modal: Ajuste / Devolução de Recebimento
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>("");
  const [reversalType, setReversalType] =
    useState<ReversalTypeCode>("RECORD_CORRECTION");
  const [reversalReason, setReversalReason] = useState<string>("");
  const [reversalSubmitting, setReversalSubmitting] = useState(false);

  const requestSeq = useRef(0);

  const syncUrl = useCallback(
    (nextPeriod: DashboardPeriod, nextBarber: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", nextPeriod);
      if (nextBarber && nextBarber !== "all") {
        params.set("barber", nextBarber);
      } else {
        params.delete("barber");
      }
      router.replace(`/admin/financeiro?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const loadData = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [barbersRes, workspaceRes] = await Promise.all([
        getBarbersAction(),
        getFinancialWorkspaceAction({
          period,
          barberId: selectedBarberId,
          startDate: paramStart || undefined,
          endDate: paramEnd || undefined,
        }),
      ]);

      if (seq !== requestSeq.current) return;

      if (barbersRes.success && barbersRes.barbers) {
        setBarbers(barbersRes.barbers as unknown as AdminBarberProp[]);
      }

      if (workspaceRes.success && workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace);
      } else {
        setErrorMessage(
          workspaceRes.error || "Não foi possível carregar o módulo financeiro."
        );
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setErrorMessage("Falha de conexão ao carregar dados financeiros.");
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [period, selectedBarberId, paramStart, paramEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (nextPeriod: DashboardPeriod) => {
    syncUrl(nextPeriod, selectedBarberId);
  };

  const handleBarberChange = (nextBarber: string) => {
    setSelectedBarberId(nextBarber);
    syncUrl(period, nextBarber);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    const parsedReais = Number(expAmountReais.replace(",", "."));
    if (!Number.isFinite(parsedReais) || parsedReais <= 0) {
      setErrorMessage("Informe um valor válido em reais para a despesa.");
      return;
    }

    setExpSubmitting(true);
    try {
      const res = await createExpenseAction({
        category: expCategory,
        description: expDescription,
        supplier: expSupplier || undefined,
        amountCents: Math.round(parsedReais * 100),
        competenceDate: expCompetenceDate,
        dueDate: expDueDate,
        paidAt: expPaidNow ? expDueDate : null,
        paymentMethod: expPaidNow ? expPaymentMethod : null,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Erro ao cadastrar despesa.");
      } else {
        setFeedbackMessage("Despesa registrada com sucesso.");
        setExpDescription("");
        setExpSupplier("");
        setExpAmountReais("");
        setShowExpenseForm(false);
        await loadData();
      }
    } finally {
      setExpSubmitting(false);
    }
  };

  const handlePayExpense = async (expenseId: string) => {
    setPayExpenseLoading(true);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const res = await payExpenseAction({
        expenseId,
        paymentMethod: payExpenseMethod,
        paidAt: payExpenseDate,
      });
      if (!res.success) {
        setErrorMessage(res.error || "Erro ao registrar pagamento da despesa.");
      } else {
        setFeedbackMessage(
          "Baixa da despesa registrada no fluxo de caixa e no livro-razão."
        );
        setPayingExpenseId(null);
        await loadData();
      }
    } finally {
      setPayExpenseLoading(false);
    }
  };

  const handleCancelExpense = async (expenseId: string) => {
    const reason = window.prompt(
      "Informe o motivo do cancelamento desta despesa para auditoria:"
    );
    if (!reason || reason.trim().length < 3) return;

    setErrorMessage(null);
    setFeedbackMessage(null);
    const res = await cancelExpenseAction({ expenseId, reason });
    if (!res.success) {
      setErrorMessage(res.error || "Erro ao cancelar despesa.");
    } else {
      setFeedbackMessage("Despesa cancelada com registro de auditoria.");
      await loadData();
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setErrorMessage(null);
    setFeedbackMessage(null);

    const parsedReais = Number(payoutAmountReais.replace(",", "."));
    if (!payoutBarberId || !Number.isFinite(parsedReais) || parsedReais <= 0) {
      setErrorMessage(
        "Selecione o profissional e informe um valor de repasse maior que zero."
      );
      return;
    }

    setPayoutSubmitting(true);
    try {
      const res = await createCommissionPayoutAction({
        barberId: payoutBarberId,
        amountCents: Math.round(parsedReais * 100),
        periodStart: workspace.statement.rangeStart,
        periodEnd: workspace.statement.rangeEnd,
        paymentMethod: payoutMethod,
        notes: payoutNotes || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Erro ao registrar repasse de comissão.");
      } else {
        setFeedbackMessage(
          "Repasse de comissão registrado! O saldo a pagar do profissional e o fluxo de caixa foram atualizados sem duplicar a dedução na competência."
        );
        setPayoutAmountReais("");
        setPayoutNotes("");
        await loadData();
      }
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleReverseReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    if (!selectedReceiptId) {
      setErrorMessage("Selecione um recebimento confirmado para ajustar.");
      return;
    }

    setReversalSubmitting(true);
    try {
      const res = await reverseReceiptWithTypeAction({
        receiptId: selectedReceiptId,
        type: reversalType,
        reason: reversalReason,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Não foi possível registrar o ajuste.");
      } else {
        setFeedbackMessage(
          reversalType === "CLIENT_REFUND"
            ? "Devolução financeira ao cliente registrada com saída de caixa e ajuste auditável."
            : "Correção administrativa registrada. O atendimento voltou para a fila de pendentes sem simular saída de dinheiro."
        );
        setSelectedReceiptId("");
        setReversalReason("");
        await loadData();
      }
    } finally {
      setReversalSubmitting(false);
    }
  };

  const stmt = workspace?.statement;
  const comp = stmt?.competence;
  const cash = stmt?.cashFlow;
  const recSummary = stmt?.receivablesSummary;

  const dashboardHref = `/admin/dashboard?period=${period}${
    selectedBarberId !== "all" ? `&barber=${selectedBarberId}` : ""
  }`;

  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white selection:bg-amber-500 selection:text-black">
      <AdminNavbar />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        {/* Header & Context Filters */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-500">
              Gestão Financeira Completa · Fase P2
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
              Resultado de Competência, Caixa, Despesas e Repasses
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-400">
              Separação rigorosa entre o que foi produzido na competência, o que
              entrou e saiu efetivamente do caixa, obrigações a vencer/vencidas e
              liquidação de comissões elegíveis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={dashboardHref}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-amber-500/30 hover:text-amber-300"
            >
              <CalendarDays className="h-4 w-4 text-amber-500" />
              Voltar ao Dashboard Executivo
            </Link>
            <button
              type="button"
              onClick={() => setShowExpenseForm((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
            >
              <PlusCircle className="h-4 w-4" />
              {showExpenseForm ? "Fechar Formulário" : "Lançar Despesa / Taxa"}
            </button>
          </div>
        </div>

        <DashboardFilters
          period={period}
          onPeriodChange={handlePeriodChange}
          selectedBarberId={selectedBarberId}
          onBarberChange={handleBarberChange}
          barbers={barbers}
        />

        {errorMessage && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        )}

        {feedbackMessage && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold text-emerald-300 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Collapsible Expense Creation Form */}
        {showExpenseForm && (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-[#141414] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Cadastrar Despesa ou Obrigação Financeira
                </h2>
                <p className="text-xs text-zinc-400">
                  Datas de competência, vencimento e pagamento são registradas
                  separadamente (sem rateio automático).
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateExpense}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Categoria
                </label>
                <select
                  value={expCategory}
                  onChange={(e) =>
                    setExpCategory(e.target.value as ExpenseCategoryCode)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                >
                  {(
                    Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategoryCode[]
                  ).map((code) => (
                    <option key={code} value={code}>
                      {EXPENSE_CATEGORY_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Aluguel Outubro / Lâminas"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Fornecedor / Beneficiário
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={expSupplier}
                  onChange={(e) => setExpSupplier(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Valor (R$) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: 1250,00"
                  value={expAmountReais}
                  onChange={(e) => setExpAmountReais(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Data de Competência (Fato Gerador) *
                </label>
                <input
                  type="date"
                  required
                  value={expCompetenceDate}
                  onChange={(e) => setExpCompetenceDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  required
                  value={expDueDate}
                  onChange={(e) => setExpDueDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-xs font-semibold text-zinc-200">
                  <input
                    type="checkbox"
                    checked={expPaidNow}
                    onChange={(e) => setExpPaidNow(e.target.checked)}
                    className="h-4 w-4 accent-amber-500"
                  />
                  Já foi paga no caixa?
                </label>
              </div>

              {expPaidNow && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Meio de Pagamento
                  </label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-sm text-white"
                  >
                    <option value="PIX">Pix</option>
                    <option value="MONEY">Dinheiro</option>
                    <option value="CARD">Cartão</option>
                    <option value="TRANSFER">Transferência / Boleto</option>
                  </select>
                </div>
              )}

              <div className="flex items-end justify-end sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={expSubmitting}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  {expSubmitting ? "Salvando..." : "Confirmar Lançamento"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading && !stmt ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-[#141414]"
              />
            ))}
          </div>
        ) : stmt && comp && cash && recSummary ? (
          <>
            {/* Partial Coverage Alert if no expenses in competence */}
            {!comp.isCompleteResult && comp.coverageNote && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-xs text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-amber-300">
                    Aviso de Cobertura Contábil:{" "}
                  </span>
                  {comp.coverageNote}
                </div>
              </div>
            )}

            {/* Top Executive Financial Cards */}
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Receita Líquida de Serviços (Competência)</span>
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  {moneyCents(comp.netServiceRevenueCents)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Bruta: {moneyCents(comp.grossRealizedCents)} · Devoluções:{" "}
                  {moneyCents(comp.competenceAdjustmentsCents)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {comp.isCompleteResult
                      ? "Resultado Gerencial (Competência)"
                      : "Contribuição da Barbearia (Parcial)"}
                  </span>
                  <Layers className="h-4 w-4 text-emerald-400" />
                </div>
                <p
                  className={`mt-2 font-display text-2xl font-bold ${
                    comp.managementResultCents >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {moneyCents(comp.managementResultCents)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Margem:{" "}
                  {comp.managementMarginRate !== null
                    ? `${comp.managementMarginRate.toLocaleString("pt-BR")}%`
                    : "—"}{" "}
                  · Comissões: {moneyCents(comp.recognizedCommissionCents)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Fluxo Líquido de Caixa do Período</span>
                  <Wallet className="h-4 w-4 text-sky-400" />
                </div>
                <p
                  className={`mt-2 font-display text-2xl font-bold ${
                    cash.netCashFlowCents >= 0
                      ? "text-sky-400"
                      : "text-red-400"
                  }`}
                >
                  {moneyCents(cash.netCashFlowCents)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Entradas: {moneyCents(cash.cashInReceiptsCents)} · Saídas:{" "}
                  {moneyCents(
                    cash.cashOutRefundsCents +
                      cash.cashOutExpensesPaidCents +
                      cash.cashOutCommissionPayoutsCents
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Passivo Elegível + Obrigações</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-amber-400">
                  {moneyCents(
                    recSummary.payableCommissionsCents +
                      recSummary.overdueExpensesCents +
                      recSummary.pendingFutureExpensesCents
                  )}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Repasses a pagar: {moneyCents(recSummary.payableCommissionsCents)}{" "}
                  · Sem caixa: {moneyCents(recSummary.completedWithoutReceiptCents)}
                </p>
              </div>
            </section>

            {/* Section 1: Cascata do Resultado de Competência vs Fluxo de Caixa */}
            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Cascata de Competência */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Regime de Competência (Fato Gerador)
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      Cascata do Resultado Operacional
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      comp.isCompleteResult
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {comp.isCompleteResult
                      ? "Resultado Completo"
                      : "Cobertura Parcial"}
                  </span>
                </div>

                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <span className="text-zinc-300">
                      (+) Receita Bruta Realizada (Concluídos)
                    </span>
                    <span className="font-bold text-white">
                      {moneyCents(comp.grossRealizedCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <span className="text-zinc-400">
                      (−) Devoluções e Ajustes de Competência
                    </span>
                    <span className="font-semibold text-red-300">
                      - {moneyCents(comp.competenceAdjustmentsCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <span className="font-semibold text-zinc-200">
                      (=) Receita Líquida de Serviços
                    </span>
                    <span className="font-bold text-white">
                      {moneyCents(comp.netServiceRevenueCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <div>
                      <span className="text-zinc-300">
                        (−) Comissões Reconhecidas (Competência)
                      </span>
                      <p className="text-[11px] text-zinc-500">
                        Deduzida uma única vez na conclusão do serviço
                      </p>
                    </div>
                    <span className="font-semibold text-amber-300">
                      - {moneyCents(comp.recognizedCommissionCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                    <span className="font-bold text-amber-200">
                      (=) Contribuição da Barbearia
                    </span>
                    <span className="font-bold text-amber-300">
                      {moneyCents(comp.barbershopContributionCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <span className="text-zinc-400">
                      (−) Taxas Diretas de Meio de Pagamento
                    </span>
                    <span className="font-semibold text-red-300">
                      - {moneyCents(comp.recognizedDirectFeesCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <span className="text-zinc-400">
                      (−) Despesas Operacionais do Período
                    </span>
                    <span className="font-semibold text-red-300">
                      - {moneyCents(comp.recognizedOperatingExpensesCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5">
                    <div>
                      <span className="font-bold text-white">
                        (=){" "}
                        {comp.isCompleteResult
                          ? "Resultado Gerencial do Período"
                          : "Resultado Parcial (Sem Despesas Lançadas)"}
                      </span>
                      {comp.managementMarginRate !== null && (
                        <p className="text-xs text-emerald-300">
                          Margem Gerencial:{" "}
                          {comp.managementMarginRate.toLocaleString("pt-BR")}%
                        </p>
                      )}
                    </div>
                    <span className="font-display text-xl font-bold text-emerald-300">
                      {moneyCents(comp.managementResultCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fluxo Líquido de Caixa do Período */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                      Regime de Caixa (Movimentação Efetiva)
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      Fluxo Líquido de Caixa do Período
                    </h2>
                  </div>
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-300">
                    Por Data de Liquidação
                  </span>
                </div>

                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                      <div>
                        <span className="text-zinc-200">
                          (+) Recebimentos Confirmados no Caixa
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          Agrupados por confirmedAt dentro do período
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-400">
                      {moneyCents(cash.cashInReceiptsCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                      <div>
                        <span className="text-zinc-300">
                          (−) Devoluções Reais ao Cliente (Refunds)
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          Saída efetiva de caixa por revertedAt
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-red-300">
                      - {moneyCents(cash.cashOutRefundsCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                      <div>
                        <span className="text-zinc-300">
                          (−) Despesas e Obrigações Pagas no Período
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          Agrupadas por paidAt (independente da competência)
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-red-300">
                      - {moneyCents(cash.cashOutExpensesPaidCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-amber-400" />
                      <div>
                        <span className="text-zinc-300">
                          (−) Repasses de Comissão Pagos aos Barbeiros
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          Saída financeira de liquidação (não duplica competência)
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-amber-300">
                      - {moneyCents(cash.cashOutCommissionPayoutsCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3.5">
                    <div>
                      <span className="font-bold text-white">
                        (=) Geração / Consumo Líquido de Caixa
                      </span>
                      <p className="text-[11px] text-sky-200">
                        Movimento líquido do período (não representa saldo bancário
                        acumulado)
                      </p>
                    </div>
                    <span className="font-display text-xl font-bold text-sky-300">
                      {moneyCents(cash.netCashFlowCents)}
                    </span>
                  </div>

                  <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#101010] px-4 py-3 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>
                        Correções administrativas de registro no período (
                        <code className="text-zinc-300">RECORD_CORRECTION</code>
                        ):
                      </span>
                      <span className="font-bold text-zinc-200">
                        {cash.recordCorrectionsCount} reg. (
                        {moneyCents(cash.recordCorrectionsInPeriodCents)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Folha de Comissões e Liquidação de Repasses por Barbeiro */}
            <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-4 lg:flex-row lg:items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    Política Recomendada · Elegível Após Conclusão + Recebimento
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    Folha de Comissões e Liquidação de Repasses por Profissional
                  </h2>
                  <p className="text-xs text-zinc-400">
                    A comissão reconhecida entra na competência na conclusão do
                    serviço; torna-se elegível para pagamento após confirmação no
                    caixa.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-400">
                      <th className="pb-3 pr-4">Profissional</th>
                      <th className="pb-3 px-3 text-right">Concluídos</th>
                      <th className="pb-3 px-3 text-right">Receita Bruta</th>
                      <th className="pb-3 px-3 text-right">
                        Comissão Reconhecida
                      </th>
                      <th className="pb-3 px-3 text-right">
                        Aguardando Caixa
                      </th>
                      <th className="pb-3 px-3 text-right text-emerald-400">
                        Comissão Elegível
                      </th>
                      <th className="pb-3 px-3 text-right text-sky-400">
                        Já Repassada
                      </th>
                      <th className="pb-3 px-3 text-right text-amber-400">
                        Saldo a Pagar
                      </th>
                      <th className="pb-3 pl-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {stmt.barberCommissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-6 text-center text-xs text-zinc-500"
                        >
                          Nenhuma comissão gerada ou repassada no período
                          selecionado.
                        </td>
                      </tr>
                    ) : (
                      stmt.barberCommissions.map((row) => (
                        <tr key={row.barberId} className="hover:bg-white/[0.02]">
                          <td className="py-3.5 pr-4 font-semibold text-white">
                            {row.barberName}
                          </td>
                          <td className="py-3.5 px-3 text-right text-zinc-300">
                            {row.completedServicesCount}
                          </td>
                          <td className="py-3.5 px-3 text-right text-zinc-300">
                            {moneyCents(row.grossServiceRevenueCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-medium text-white">
                            {moneyCents(row.recognizedCommissionCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-zinc-400">
                            {moneyCents(row.pendingReceiptCommissionCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-semibold text-emerald-400">
                            {moneyCents(row.eligibleCommissionCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-semibold text-sky-400">
                            {moneyCents(row.paidCommissionCents)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-amber-400">
                            {moneyCents(row.payableCommissionCents)}
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setPayoutBarberId(row.barberId);
                                setPayoutAmountReais(
                                  row.payableCommissionCents > 0
                                    ? (row.payableCommissionCents / 100)
                                        .toFixed(2)
                                        .replace(".", ",")
                                    : ""
                                );
                              }}
                              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                            >
                              Registrar Repasse
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form para registrar repasse de comissão */}
              <form
                onSubmit={handleCreatePayout}
                className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-white/[0.06] bg-[#101010] p-4 sm:grid-cols-2 lg:grid-cols-5"
              >
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-zinc-400">
                    Profissional
                  </label>
                  <select
                    value={payoutBarberId}
                    onChange={(e) => setPayoutBarberId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white"
                  >
                    <option value="">Selecione o barbeiro...</option>
                    {(workspace?.barbers ?? []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-zinc-400">
                    Valor do Repasse (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: 450,00"
                    value={payoutAmountReais}
                    onChange={(e) => setPayoutAmountReais(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-zinc-400">
                    Meio de Pagamento
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white"
                  >
                    <option value="PIX">Pix</option>
                    <option value="MONEY">Dinheiro</option>
                    <option value="TRANSFER">Transferência</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase text-zinc-400">
                    Observação / Quinzena
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Fechamento semanal"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
                  >
                    <Banknote className="h-4 w-4" />
                    {payoutSubmitting
                      ? "Registrando..."
                      : "Confirmar Repasse"}
                  </button>
                </div>
              </form>
            </section>

            {/* Section 3: Despesas por Categoria e Lista de Obrigações */}
            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Despesas por Categoria */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                  Composição de Custos
                </span>
                <h2 className="mt-1 text-base font-bold text-white">
                  Despesas por Categoria na Competência
                </h2>

                {stmt.expensesByCategory.length === 0 ? (
                  <p className="mt-6 text-xs text-zinc-500">
                    Nenhuma despesa registrada na competência selecionada. Use o
                    botão &ldquo;Lançar Despesa / Taxa&rdquo; no topo para
                    registrar aluguel, insumos, energia ou taxas.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {stmt.expensesByCategory.map((cat) => (
                      <div
                        key={cat.category}
                        className="rounded-xl border border-white/[0.05] bg-[#101010] p-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">
                            {cat.label}
                          </span>
                          <span className="font-bold text-amber-300">
                            {moneyCents(cat.competenceAmountCents)} (
                            {cat.shareRate.toLocaleString("pt-BR")}%)
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{
                              width: `${Math.min(100, Math.max(4, cat.shareRate))}%`,
                            }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Pago: {moneyCents(cat.paidInPeriodCents)}</span>
                          <span>
                            Em aberto: {moneyCents(cat.pendingAmountCents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de Despesas e Contas a Pagar */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                      Contas a Pagar e Pagas
                    </span>
                    <h2 className="mt-1 text-base font-bold text-white">
                      Obrigações e Despesas Registradas
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {(workspace?.expenses ?? []).length} registro(s)
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400">
                        <th className="pb-2.5 pr-3">Descrição / Categoria</th>
                        <th className="pb-2.5 px-2">Competência</th>
                        <th className="pb-2.5 px-2">Vencimento</th>
                        <th className="pb-2.5 px-2">Pagamento</th>
                        <th className="pb-2.5 px-2 text-right">Valor</th>
                        <th className="pb-2.5 px-2">Status</th>
                        <th className="pb-2.5 pl-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {(workspace?.expenses ?? []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center text-xs text-zinc-500"
                          >
                            Nenhuma despesa cadastrada para este filtro.
                          </td>
                        </tr>
                      ) : (
                        (workspace?.expenses ?? []).map((exp) => (
                          <tr
                            key={exp.id}
                            className="hover:bg-white/[0.02]"
                          >
                            <td className="py-3 pr-3">
                              <p className="font-semibold text-white">
                                {exp.description}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {EXPENSE_CATEGORY_LABELS[exp.category] ||
                                  exp.category}
                                {exp.supplier ? ` · ${exp.supplier}` : ""}
                              </p>
                            </td>
                            <td className="py-3 px-2 text-zinc-300">
                              {formatDateBR(exp.competenceDate)}
                            </td>
                            <td className="py-3 px-2 text-zinc-300">
                              {formatDateBR(exp.dueDate)}
                            </td>
                            <td className="py-3 px-2 text-zinc-400">
                              {exp.paidAt
                                ? `${formatDateBR(exp.paidAt)} (${exp.paymentMethod || "—"})`
                                : "—"}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-white">
                              {moneyCents(exp.amountCents)}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  exp.status === "PAID"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : exp.status === "CANCELED"
                                      ? "bg-zinc-500/20 text-zinc-400 line-through"
                                      : "bg-amber-500/15 text-amber-300"
                                }`}
                              >
                                {exp.status === "PAID"
                                  ? "PAGA"
                                  : exp.status === "CANCELED"
                                    ? "CANCELADA"
                                    : "PENDENTE"}
                              </span>
                            </td>
                            <td className="py-3 pl-2 text-right">
                              {exp.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {payingExpenseId === exp.id ? (
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={payExpenseMethod}
                                        onChange={(e) =>
                                          setPayExpenseMethod(e.target.value)
                                        }
                                        className="rounded-lg border border-white/10 bg-[#0c0c0c] px-2 py-1 text-[11px] text-white"
                                      >
                                        <option value="PIX">Pix</option>
                                        <option value="MONEY">Dinheiro</option>
                                        <option value="CARD">Cartão</option>
                                        <option value="TRANSFER">Transf.</option>
                                      </select>
                                      <input
                                        type="date"
                                        value={payExpenseDate}
                                        onChange={(e) =>
                                          setPayExpenseDate(e.target.value)
                                        }
                                        className="rounded-lg border border-white/10 bg-[#0c0c0c] px-2 py-1 text-[11px] text-white"
                                      />
                                      <button
                                        type="button"
                                        disabled={payExpenseLoading}
                                        onClick={() => handlePayExpense(exp.id)}
                                        className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-black hover:bg-emerald-400"
                                      >
                                        OK
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPayingExpenseId(null)}
                                        className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPayingExpenseId(exp.id)
                                        }
                                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                                      >
                                        Dar Baixa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCancelExpense(exp.id)
                                        }
                                        className="rounded-lg border border-red-500/20 bg-red-500/10 p-1 text-red-300 hover:bg-red-500/20"
                                        title="Cancelar despesa"
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 4: Pendências por Idade (Aging) — 2 Séries Separadas */}
            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Série 1 · Dias Desde o Serviço
                    </span>
                    <h2 className="mt-1 text-base font-bold text-white">
                      Atendimentos Concluídos Sem Recebimento por Idade
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDetailFilter({
                        kind: "pending",
                        period,
                        barberId: selectedBarberId,
                      })
                    }
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                  >
                    Inspecionar Fila ({recSummary.completedWithoutReceiptCount})
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {stmt.aging.unpaidCompletedServices.map((b) => (
                    <div
                      key={b.bucket}
                      className="rounded-xl border border-white/[0.05] bg-[#101010] p-3"
                    >
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {b.bucket}
                      </span>
                      <p className="mt-1 text-sm font-bold text-white">
                        {moneyCents(b.amountCents)}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {b.count} atend.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                    Série 2 · Dias Desde o Vencimento
                  </span>
                  <h2 className="mt-1 text-base font-bold text-white">
                    Obrigações e Despesas Pendentes por Vencimento
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stmt.aging.unpaidExpenses.map((b) => (
                    <div
                      key={b.bucket}
                      className="rounded-xl border border-white/[0.05] bg-[#101010] p-3"
                    >
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {b.bucket}
                      </span>
                      <p className="mt-1 text-sm font-bold text-white">
                        {moneyCents(b.amountCents)}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {b.count} conta(s)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 5: Ajustes Auditáveis (RECORD_CORRECTION vs CLIENT_REFUND) e Livro-Razão */}
            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Formulário de Correção de Registro vs Devolução ao Cliente */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-500" />
                  <h2 className="text-base font-bold text-white">
                    Registrar Correção Operacional ou Devolução ao Cliente
                  </h2>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Separa erro administrativo de marcação (
                  <code className="text-zinc-300">RECORD_CORRECTION</code>) de
                  devolução real de dinheiro (
                  <code className="text-zinc-300">CLIENT_REFUND</code>).
                </p>

                <form
                  onSubmit={handleReverseReceipt}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Recebimento Confirmado no Período
                    </label>
                    <select
                      value={selectedReceiptId}
                      onChange={(e) => setSelectedReceiptId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-xs text-white"
                    >
                      <option value="">
                        Selecione um comprovante confirmado...
                      </option>
                      {(workspace?.confirmedReceiptsForAdjustment ?? []).map(
                        (item) => (
                          <option
                            key={item.receipt!.id}
                            value={item.receipt!.id}
                          >
                            {formatDateBR(item.receipt!.confirmedAt)} ·{" "}
                            {item.clientName} ({item.serviceName}) —{" "}
                            {moneyCents(item.receipt!.paidAmountCents)} [
                            {item.receipt!.method}]
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Natureza do Ajuste
                    </label>
                    <select
                      value={reversalType}
                      onChange={(e) =>
                        setReversalType(e.target.value as ReversalTypeCode)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-xs text-white"
                    >
                      <option value="RECORD_CORRECTION">
                        Correção Administrativa de Registro (não houve saída de
                        dinheiro ao cliente)
                      </option>
                      <option value="CLIENT_REFUND">
                        Devolução Financeira ao Cliente (dinheiro entrou e foi
                        devolvido)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Justificativa Obrigatória para Auditoria *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Recebimento confirmado no agendamento errado / Estorno Pix ao cliente"
                      value={reversalReason}
                      onChange={(e) => setReversalReason(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reversalSubmitting}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {reversalSubmitting
                      ? "Processando..."
                      : "Executar Ajuste Auditável"}
                  </button>
                </form>
              </div>

              {/* Livro-Razão Imutável (FinancialMovement) */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-400" />
                    <h2 className="text-base font-bold text-white">
                      Livro-Razão de Movimentos Financeiros Imutáveis
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {(workspace?.movements ?? []).length} evento(s)
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Trilha cronológica de baixas de despesas, repasses de comissão,
                  devoluções e correções administrativas.
                </p>

                <div className="mt-4 max-h-72 space-y-2.5 overflow-y-auto pr-1">
                  {(workspace?.movements ?? []).length === 0 ? (
                    <p className="py-8 text-center text-xs text-zinc-500">
                      Nenhum movimento manual registrado neste período ainda.
                    </p>
                  ) : (
                    (workspace?.movements ?? []).map((mov) => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#101010] px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                              {mov.type}
                            </span>
                            <span className="font-semibold text-white">
                              {mov.description}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            {formatDateBR(mov.occurredAt)} · Por{" "}
                            {mov.actorName || "Admin"}
                            {mov.method ? ` · ${mov.method}` : ""}
                            {mov.reason ? ` · Motivo: ${mov.reason}` : ""}
                          </p>
                        </div>
                        <span className="font-bold text-white">
                          {moneyCents(mov.amountCents)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Matriz de Disponibilidade de Métricas */}
            <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#141414] p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Matriz de Disponibilidade de Métricas e Governança Contábil
                </h2>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                  <span className="font-bold text-emerald-300">
                    Fase P0 & P1 · Ativas
                  </span>
                  <p className="mt-1 text-zinc-300">
                    Produção, Caixa confirmado, Pendentes, Comissões geradas,
                    Comparativos MTD/YTD, Meios de Pagamento e Matriz Barbeiro ×
                    Serviço.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                  <span className="font-bold text-emerald-300">
                    Fase P2 (Despesas e Resultado) · Ativa
                  </span>
                  <p className="mt-1 text-zinc-300">
                    Despesas com competência, vencimento e pagamento separados;
                    Cascata de Competência vs Fluxo Líquido de Caixa.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                  <span className="font-bold text-emerald-300">
                    Fase P2 (Liquidação de Comissões) · Ativa
                  </span>
                  <p className="mt-1 text-zinc-300">
                    Dedução única na competência; comissão elegível após
                    recebimento e baixa de passivo via{" "}
                    <code>CommissionPayout</code>.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
                  <span className="font-bold text-emerald-300">
                    Fase P3 (Capacidade, Ocupação e Coortes) · Ativa
                  </span>
                  <p className="mt-1 text-zinc-300">
                    Ocupação por jornada com exceções (
                    <code>BarberScheduleException</code>), coortes de 30 dias
                    maduras e vínculo canônico auditado (
                    <code>ClientIdentityLink</code>).
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {detailFilter && (
        <InsightDetailsDialog
          filter={detailFilter}
          title="Concluídos sem recebimento confirmado"
          onClose={() => setDetailFilter(null)}
        />
      )}
    </main>
  );
}

export default function AdminFinanceiroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0c0c] p-8 text-sm text-zinc-400">
          Carregando módulo financeiro...
        </div>
      }
    >
      <AdminFinanceiroContent />
    </Suspense>
  );
}
