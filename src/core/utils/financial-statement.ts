export type ExpenseCategoryCode =
  | "RENT"
  | "UTILITIES"
  | "SUPPLIES"
  | "EQUIPMENT"
  | "MARKETING"
  | "TAXES"
  | "FIXED_PAYROLL"
  | "DIRECT_FEE"
  | "OTHER";

export type ExpenseStatusCode = "PENDING" | "PAID" | "CANCELED";

export type ReversalTypeCode = "RECORD_CORRECTION" | "CLIENT_REFUND";

export type FinancialMovementTypeCode =
  | "RECEIPT_IN"
  | "RECORD_CORRECTION"
  | "CLIENT_REFUND_OUT"
  | "EXPENSE_OUT"
  | "COMMISSION_PAYOUT_OUT";

export interface FinancialAppointmentInput {
  id: string;
  barberId: string;
  barberName: string;
  clientName: string;
  serviceName: string;
  date: Date;
  status: string; // COMPLETED, CONFIRMED, CANCELED, NO_SHOW
  priceCents: number;
  commissionCents: number;
  receipt?: {
    id: string;
    status: "CONFIRMED" | "REVERTED";
    paidAmountCents: number;
    method: string;
    confirmedAt: Date;
    reversal?: {
      type: ReversalTypeCode;
      reason: string;
      revertedAt: Date;
    } | null;
  } | null;
}

export interface ExpenseInput {
  id: string;
  category: ExpenseCategoryCode;
  description: string;
  supplier: string | null;
  amountCents: number;
  competenceDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
  status: ExpenseStatusCode;
  createdByName?: string;
  paidByName?: string | null;
  canceledReason?: string | null;
}

export interface CommissionPayoutInput {
  id: string;
  barberId: string;
  barberName: string;
  amountCents: number;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date;
  paymentMethod: string;
  notes: string | null;
  paidByName?: string;
  status: "PAID" | "REVERSED";
}

export interface FinancialMovementInput {
  id: string;
  type: FinancialMovementTypeCode;
  amountCents: number;
  occurredAt: Date;
  recordedAt: Date;
  method: string | null;
  description: string;
  reason: string | null;
  actorName?: string;
  appointmentId?: string | null;
  receiptId?: string | null;
  expenseId?: string | null;
  payoutId?: string | null;
}

export interface CompetenceWaterfall {
  grossRealizedCents: number;
  competenceAdjustmentsCents: number;
  netServiceRevenueCents: number;
  recognizedCommissionCents: number;
  barbershopContributionCents: number;
  recognizedDirectFeesCents: number;
  recognizedOperatingExpensesCents: number;
  managementResultCents: number;
  managementMarginRate: number | null;
  isCompleteResult: boolean;
  coverageNote: string | null;
}

export interface CashFlowSummary {
  cashInReceiptsCents: number;
  cashOutRefundsCents: number;
  cashOutExpensesPaidCents: number;
  cashOutCommissionPayoutsCents: number;
  netCashFlowCents: number;
  recordCorrectionsInPeriodCents: number;
  recordCorrectionsCount: number;
}

export interface BarberCommissionSettlement {
  barberId: string;
  barberName: string;
  completedServicesCount: number;
  grossServiceRevenueCents: number;
  recognizedCommissionCents: number;
  eligibleCommissionCents: number;
  pendingReceiptCommissionCents: number;
  paidCommissionCents: number;
  payableCommissionCents: number;
  overpaidCommissionCents: number;
}

export interface ExpenseCategorySummary {
  category: ExpenseCategoryCode;
  label: string;
  competenceAmountCents: number;
  paidInPeriodCents: number;
  pendingAmountCents: number;
  shareRate: number;
  count: number;
}

export interface AgingBucketItem {
  bucket: string;
  count: number;
  amountCents: number;
}

export interface FinancialStatementReport {
  rangeStart: string;
  rangeEnd: string;
  competence: CompetenceWaterfall;
  cashFlow: CashFlowSummary;
  barberCommissions: BarberCommissionSettlement[];
  expensesByCategory: ExpenseCategorySummary[];
  receivablesSummary: {
    completedWithoutReceiptCount: number;
    completedWithoutReceiptCents: number;
    pendingFutureExpensesCount: number;
    pendingFutureExpensesCents: number;
    overdueExpensesCount: number;
    overdueExpensesCents: number;
    payableCommissionsCents: number;
  };
  aging: {
    unpaidCompletedServices: AgingBucketItem[];
    unpaidExpenses: AgingBucketItem[];
  };
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryCode, string> = {
  RENT: "Aluguel e Ocupação",
  UTILITIES: "Água, Luz, Internet e Telefonia",
  SUPPLIES: "Insumos e Produtos de Barbearia",
  EQUIPMENT: "Equipamentos e Manutenção",
  MARKETING: "Marketing e Captação",
  TAXES: "Impostos, Taxas e Contabilidade",
  FIXED_PAYROLL: "Salários Fixos / Pró-labore / Recepção",
  DIRECT_FEE: "Taxas Diretas de Meio de Pagamento",
  OTHER: "Outras Despesas Operacionais",
};

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function diffInDaysFloor(target: Date, ref: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((ref.getTime() - target.getTime()) / msPerDay);
}

/**
 * Motor puro de apuração da Cascata do Resultado de Competência,
 * Fluxo Líquido de Caixa do Período, Liquidação de Comissões e Aging.
 *
 * Regras centrais garantidas:
 * 1. Comissão é deduzida UMA ÚNICA VEZ na competência (quando o serviço é concluído).
 * 2. Repasse pago ao barbeiro (CommissionPayout) é saída de caixa e baixa de passivo de comissão,
 *    nunca uma segunda despesa na cascata de competência.
 * 3. Recebimento confirmado em t1 e estornado/devolvido em t2 preserva o histórico de t1 por confirmedAt
 *    e lança o ajuste auditável em t2 por revertedAt.
 */
export function buildFinancialStatement(params: {
  appointments: FinancialAppointmentInput[];
  expenses: ExpenseInput[];
  payouts: CommissionPayoutInput[];
  rangeStart: Date;
  rangeEnd: Date;
  referenceNow?: Date;
}): FinancialStatementReport {
  const {
    appointments,
    expenses,
    payouts,
    rangeStart,
    rangeEnd,
    referenceNow = rangeEnd,
  } = params;

  // 1. CASCATA DE COMPETÊNCIA
  let grossRealizedCents = 0;
  let recognizedCommissionCents = 0;
  let competenceAdjustmentsCents = 0;

  // 2. FLUXO DE CAIXA DO PERÍODO
  let cashInReceiptsCents = 0;
  let cashOutRefundsCents = 0;
  let recordCorrectionsInPeriodCents = 0;
  let recordCorrectionsCount = 0;

  // 3. RECEBÍVEIS OPERACIONAIS
  let completedWithoutReceiptCount = 0;
  let completedWithoutReceiptCents = 0;

  const serviceAgingMap: Record<string, { count: number; amountCents: number }> = {
    "0–3 dias": { count: 0, amountCents: 0 },
    "4–7 dias": { count: 0, amountCents: 0 },
    "8–15 dias": { count: 0, amountCents: 0 },
    "16–30 dias": { count: 0, amountCents: 0 },
    "> 30 dias": { count: 0, amountCents: 0 },
  };

  const barberMap = new Map<
    string,
    {
      barberId: string;
      barberName: string;
      completedServicesCount: number;
      grossServiceRevenueCents: number;
      recognizedCommissionCents: number;
      eligibleCommissionCents: number;
      paidCommissionCents: number;
    }
  >();

  const ensureBarber = (barberId: string, barberName: string) => {
    let entry = barberMap.get(barberId);
    if (!entry) {
      entry = {
        barberId,
        barberName,
        completedServicesCount: 0,
        grossServiceRevenueCents: 0,
        recognizedCommissionCents: 0,
        eligibleCommissionCents: 0,
        paidCommissionCents: 0,
      };
      barberMap.set(barberId, entry);
    }
    return entry;
  };

  for (const appt of appointments) {
    const inCompetence = isWithinRange(appt.date, rangeStart, rangeEnd);
    const receipt = appt.receipt;

    // A) Competência do serviço concluído
    if (inCompetence && appt.status === "COMPLETED") {
      grossRealizedCents += appt.priceCents;
      recognizedCommissionCents += appt.commissionCents;

      const barberEntry = ensureBarber(appt.barberId, appt.barberName);
      barberEntry.completedServicesCount += 1;
      barberEntry.grossServiceRevenueCents += appt.priceCents;
      barberEntry.recognizedCommissionCents += appt.commissionCents;

      // Comissão elegível para repasse: concluído + com recebimento válido até o fim do período
      const hasValidReceiptAtPeriodEnd =
        receipt != null &&
        (receipt.status === "CONFIRMED" ||
          (receipt.status === "REVERTED" &&
            receipt.reversal != null &&
            receipt.reversal.revertedAt.getTime() > rangeEnd.getTime()));

      if (hasValidReceiptAtPeriodEnd) {
        barberEntry.eligibleCommissionCents += appt.commissionCents;
      } else {
        completedWithoutReceiptCount += 1;
        completedWithoutReceiptCents += appt.priceCents;

        const daysSinceService = Math.max(0, diffInDaysFloor(appt.date, referenceNow));
        let bucket = "> 30 dias";
        if (daysSinceService <= 3) bucket = "0–3 dias";
        else if (daysSinceService <= 7) bucket = "4–7 dias";
        else if (daysSinceService <= 15) bucket = "8–15 dias";
        else if (daysSinceService <= 30) bucket = "16–30 dias";

        serviceAgingMap[bucket].count += 1;
        serviceAgingMap[bucket].amountCents += appt.priceCents;
      }
    }

    // B) Fluxo de Caixa e Reversões (independente da data de competência do agendamento)
    if (receipt) {
      const confirmedInPeriod = isWithinRange(receipt.confirmedAt, rangeStart, rangeEnd);
      const reversal = receipt.reversal;
      const revertedInPeriod =
        receipt.status === "REVERTED" &&
        reversal != null &&
        isWithinRange(reversal.revertedAt, rangeStart, rangeEnd);
      const revertedAfterPeriod =
        receipt.status === "REVERTED" &&
        reversal != null &&
        reversal.revertedAt.getTime() > rangeEnd.getTime();

      if (confirmedInPeriod) {
        if (receipt.status === "CONFIRMED") {
          cashInReceiptsCents += receipt.paidAmountCents;
        } else if (receipt.status === "REVERTED" && reversal) {
          if (reversal.type === "CLIENT_REFUND") {
            // Dinheiro entrou de fato em confirmedAt
            cashInReceiptsCents += receipt.paidAmountCents;
          } else if (revertedAfterPeriod) {
            // Estornado apenas em período futuro (ex.: confirmado em outubro e estornado em novembro):
            // preserva a fotografia histórica de outubro por confirmedAt.
            cashInReceiptsCents += receipt.paidAmountCents;
          } else {
            // RECORD_CORRECTION dentro do próprio período: erro operacional corrigido no mesmo período, não infla caixa
            recordCorrectionsInPeriodCents += receipt.paidAmountCents;
            recordCorrectionsCount += 1;
          }
        }
      }

      if (revertedInPeriod && reversal) {
        if (reversal.type === "CLIENT_REFUND") {
          // Saída real de dinheiro ao cliente em revertedAt e ajuste de devolução no período
          cashOutRefundsCents += receipt.paidAmountCents;
          competenceAdjustmentsCents += receipt.paidAmountCents;
        } else {
          // RECORD_CORRECTION em período posterior ao confirmedAt:
          // se foi confirmado antes de rangeStart e corrigido neste período, registra o ajuste auditável em revertedAt
          if (!confirmedInPeriod && receipt.confirmedAt.getTime() < rangeStart.getTime()) {
            competenceAdjustmentsCents += receipt.paidAmountCents;
            recordCorrectionsInPeriodCents += receipt.paidAmountCents;
            recordCorrectionsCount += 1;
          }
        }
      }
    }
  }

  // 4. DESPESAS (Competência vs Caixa vs Vencimento)
  let recognizedDirectFeesCents = 0;
  let recognizedOperatingExpensesCents = 0;
  let cashOutExpensesPaidCents = 0;
  let expensesInPeriodCount = 0;
  let pendingFutureExpensesCount = 0;
  let pendingFutureExpensesCents = 0;
  let overdueExpensesCount = 0;
  let overdueExpensesCents = 0;

  const categoryTotals = new Map<
    ExpenseCategoryCode,
    {
      competenceAmountCents: number;
      paidInPeriodCents: number;
      pendingAmountCents: number;
      count: number;
    }
  >();

  for (const code of Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategoryCode[]) {
    categoryTotals.set(code, {
      competenceAmountCents: 0,
      paidInPeriodCents: 0,
      pendingAmountCents: 0,
      count: 0,
    });
  }

  const expenseAgingMap: Record<string, { count: number; amountCents: number }> = {
    "A vencer": { count: 0, amountCents: 0 },
    "0–3 dias": { count: 0, amountCents: 0 },
    "4–7 dias": { count: 0, amountCents: 0 },
    "8–15 dias": { count: 0, amountCents: 0 },
    "16–30 dias": { count: 0, amountCents: 0 },
    "> 30 dias": { count: 0, amountCents: 0 },
  };

  for (const exp of expenses) {
    if (exp.status === "CANCELED") continue;

    const catEntry =
      categoryTotals.get(exp.category) ??
      categoryTotals.get("OTHER")!;

    const inCompetence = isWithinRange(exp.competenceDate, rangeStart, rangeEnd);
    if (inCompetence) {
      expensesInPeriodCount += 1;
      catEntry.competenceAmountCents += exp.amountCents;
      catEntry.count += 1;

      if (exp.category === "DIRECT_FEE") {
        recognizedDirectFeesCents += exp.amountCents;
      } else {
        recognizedOperatingExpensesCents += exp.amountCents;
      }

      if (exp.status === "PENDING") {
        catEntry.pendingAmountCents += exp.amountCents;
      }
    }

    if (exp.status === "PAID" && exp.paidAt && isWithinRange(exp.paidAt, rangeStart, rangeEnd)) {
      cashOutExpensesPaidCents += exp.amountCents;
      catEntry.paidInPeriodCents += exp.amountCents;
    }

    // Obrigações em aberto (PENDING) avaliadas contra referenceNow
    if (exp.status === "PENDING") {
      const daysPastDue = diffInDaysFloor(exp.dueDate, referenceNow);
      if (daysPastDue < 0) {
        pendingFutureExpensesCount += 1;
        pendingFutureExpensesCents += exp.amountCents;
        expenseAgingMap["A vencer"].count += 1;
        expenseAgingMap["A vencer"].amountCents += exp.amountCents;
      } else {
        overdueExpensesCount += 1;
        overdueExpensesCents += exp.amountCents;
        let bucket = "> 30 dias";
        if (daysPastDue <= 3) bucket = "0–3 dias";
        else if (daysPastDue <= 7) bucket = "4–7 dias";
        else if (daysPastDue <= 15) bucket = "8–15 dias";
        else if (daysPastDue <= 30) bucket = "16–30 dias";

        expenseAgingMap[bucket].count += 1;
        expenseAgingMap[bucket].amountCents += exp.amountCents;
      }
    }
  }

  // 5. REPASSES DE COMISSÃO (CommissionPayout)
  let cashOutCommissionPayoutsCents = 0;

  for (const payout of payouts) {
    if (payout.status !== "PAID") continue;

    const paidInPeriod = isWithinRange(payout.paidAt, rangeStart, rangeEnd);
    const overlapsCompetence =
      payout.periodStart.getTime() <= rangeEnd.getTime() &&
      payout.periodEnd.getTime() >= rangeStart.getTime();

    if (paidInPeriod) {
      cashOutCommissionPayoutsCents += payout.amountCents;
    }

    if (paidInPeriod || overlapsCompetence) {
      const barberEntry = ensureBarber(payout.barberId, payout.barberName);
      barberEntry.paidCommissionCents += payout.amountCents;
    }
  }

  // 6. CONSOLIDAÇÃO DA CASCATA DE COMPETÊNCIA
  const netServiceRevenueCents = grossRealizedCents - competenceAdjustmentsCents;
  const barbershopContributionCents = netServiceRevenueCents - recognizedCommissionCents;
  const managementResultCents =
    barbershopContributionCents -
    recognizedDirectFeesCents -
    recognizedOperatingExpensesCents;

  const managementMarginRate =
    netServiceRevenueCents > 0
      ? Math.round((managementResultCents / netServiceRevenueCents) * 1000) / 10
      : null;

  const isCompleteResult = expensesInPeriodCount > 0;
  const coverageNote = isCompleteResult
    ? null
    : "Cobertura parcial: nenhuma despesa operacional ou taxa direta foi registrada na competência selecionada. O resultado exibido equivale à Contribuição da Barbearia até que as despesas do período sejam lançadas.";

  // 7. CONSOLIDAÇÃO DO FLUXO DE CAIXA
  const netCashFlowCents =
    cashInReceiptsCents -
    cashOutRefundsCents -
    cashOutExpensesPaidCents -
    cashOutCommissionPayoutsCents;

  // 8. CONSOLIDAÇÃO DA FOLHA DE COMISSÕES POR BARBEIRO
  let payableCommissionsCents = 0;
  const barberCommissions: BarberCommissionSettlement[] = Array.from(
    barberMap.values()
  )
    .map((b) => {
      const pendingReceiptCommissionCents = Math.max(
        0,
        b.recognizedCommissionCents - b.eligibleCommissionCents
      );
      const payableCommissionCents = Math.max(
        0,
        b.eligibleCommissionCents - b.paidCommissionCents
      );
      const overpaidCommissionCents = Math.max(
        0,
        b.paidCommissionCents - b.eligibleCommissionCents
      );
      payableCommissionsCents += payableCommissionCents;

      return {
        barberId: b.barberId,
        barberName: b.barberName,
        completedServicesCount: b.completedServicesCount,
        grossServiceRevenueCents: b.grossServiceRevenueCents,
        recognizedCommissionCents: b.recognizedCommissionCents,
        eligibleCommissionCents: b.eligibleCommissionCents,
        pendingReceiptCommissionCents,
        paidCommissionCents: b.paidCommissionCents,
        payableCommissionCents,
        overpaidCommissionCents,
      };
    })
    .sort((a, b) => b.recognizedCommissionCents - a.recognizedCommissionCents);

  // 9. DESPESAS POR CATEGORIA
  const totalCompetenceExpensesCents =
    recognizedDirectFeesCents + recognizedOperatingExpensesCents;

  const expensesByCategory: ExpenseCategorySummary[] = (
    Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategoryCode[]
  )
    .map((category) => {
      const entry = categoryTotals.get(category)!;
      const shareRate =
        totalCompetenceExpensesCents > 0
          ? Math.round(
              (entry.competenceAmountCents / totalCompetenceExpensesCents) * 1000
            ) / 10
          : 0;
      return {
        category,
        label: EXPENSE_CATEGORY_LABELS[category],
        competenceAmountCents: entry.competenceAmountCents,
        paidInPeriodCents: entry.paidInPeriodCents,
        pendingAmountCents: entry.pendingAmountCents,
        shareRate,
        count: entry.count,
      };
    })
    .filter(
      (item) =>
        item.count > 0 ||
        item.competenceAmountCents > 0 ||
        item.paidInPeriodCents > 0
    )
    .sort((a, b) => b.competenceAmountCents - a.competenceAmountCents);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    competence: {
      grossRealizedCents,
      competenceAdjustmentsCents,
      netServiceRevenueCents,
      recognizedCommissionCents,
      barbershopContributionCents,
      recognizedDirectFeesCents,
      recognizedOperatingExpensesCents,
      managementResultCents,
      managementMarginRate,
      isCompleteResult,
      coverageNote,
    },
    cashFlow: {
      cashInReceiptsCents,
      cashOutRefundsCents,
      cashOutExpensesPaidCents,
      cashOutCommissionPayoutsCents,
      netCashFlowCents,
      recordCorrectionsInPeriodCents,
      recordCorrectionsCount,
    },
    barberCommissions,
    expensesByCategory,
    receivablesSummary: {
      completedWithoutReceiptCount,
      completedWithoutReceiptCents,
      pendingFutureExpensesCount,
      pendingFutureExpensesCents,
      overdueExpensesCount,
      overdueExpensesCents,
      payableCommissionsCents,
    },
    aging: {
      unpaidCompletedServices: Object.entries(serviceAgingMap).map(
        ([bucket, val]) => ({
          bucket,
          count: val.count,
          amountCents: val.amountCents,
        })
      ),
      unpaidExpenses: Object.entries(expenseAgingMap).map(([bucket, val]) => ({
        bucket,
        count: val.count,
        amountCents: val.amountCents,
      })),
    },
  };
}
