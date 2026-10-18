import {
  buildFinancialStatement,
  type CommissionPayoutInput,
  type ExpenseCategoryCode,
  type ExpenseInput,
  type ExpenseStatusCode,
  type FinancialAppointmentInput,
  type FinancialMovementInput,
  type FinancialMovementTypeCode,
  type FinancialStatementReport,
  type ReversalTypeCode,
} from "@/core/utils/financial-statement";
import { prisma } from "../db/prisma-client";

export interface FinancialWorkspaceData {
  statement: FinancialStatementReport;
  expenses: ExpenseInput[];
  payouts: CommissionPayoutInput[];
  movements: FinancialMovementInput[];
  unpaidCompletedAppointments: FinancialAppointmentInput[];
  confirmedReceiptsForAdjustment: FinancialAppointmentInput[];
  barbers: { id: string; name: string }[];
}

let tablesInitialized = false;

export class PrismaFinancialLedgerRepository {
  async ensureFinanceTablesExist(): Promise<void> {
    if (tablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "PaymentReversal" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'RECORD_CORRECTION';`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Expense" (
          "id" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "supplier" TEXT,
          "amountCents" INTEGER NOT NULL,
          "competenceDate" TIMESTAMP(3) NOT NULL,
          "dueDate" TIMESTAMP(3) NOT NULL,
          "paidAt" TIMESTAMP(3),
          "paymentMethod" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdById" TEXT NOT NULL,
          "paidById" TEXT,
          "canceledReason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CommissionPayout" (
          "id" TEXT NOT NULL,
          "barberId" TEXT NOT NULL,
          "amountCents" INTEGER NOT NULL,
          "periodStart" TIMESTAMP(3) NOT NULL,
          "periodEnd" TIMESTAMP(3) NOT NULL,
          "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "paymentMethod" TEXT NOT NULL,
          "notes" TEXT,
          "paidById" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PAID',
          "reversedAt" TIMESTAMP(3),
          "reversalReason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CommissionPayout_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CommissionPayout_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "CommissionPayout_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FinancialMovement" (
          "id" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "amountCents" INTEGER NOT NULL,
          "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "method" TEXT,
          "description" TEXT NOT NULL,
          "reason" TEXT,
          "appointmentId" TEXT,
          "receiptId" TEXT,
          "expenseId" TEXT,
          "payoutId" TEXT,
          "actorId" TEXT NOT NULL,
          "idempotencyKey" TEXT,
          CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "FinancialMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      tablesInitialized = true;
    } catch (err) {
      console.warn("[PrismaFinancialLedgerRepository] Warning ensuring P2 tables:", err);
    }
  }

  async getFinancialWorkspaceData(params: {
    rangeStart: Date;
    rangeEnd: Date;
    barberId?: string;
  }): Promise<FinancialWorkspaceData> {
    await this.ensureFinanceTablesExist();

    const { rangeStart, rangeEnd, barberId } = params;
    const barberFilter =
      barberId && barberId !== "all" ? { barberId } : {};

    const [barberRows, rawAppointments, rawExpenses, rawPayouts, rawMovements] =
      await Promise.all([
        prisma.barber.findMany({
          where: { user: { active: true } },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.appointment.findMany({
          where: {
            ...barberFilter,
            OR: [
              { startTime: { gte: rangeStart, lte: rangeEnd } },
              {
                receipt: {
                  is: {
                    confirmedAt: { gte: rangeStart, lte: rangeEnd },
                  },
                },
              },
              {
                receipt: {
                  is: {
                    reversal: {
                      is: {
                        revertedAt: { gte: rangeStart, lte: rangeEnd },
                      },
                    },
                  },
                },
              },
            ],
          },
          include: {
            barber: { include: { user: { select: { name: true } } } },
            client: { select: { name: true } },
            clientContact: { select: { name: true } },
            service: { select: { name: true } },
            receipt: {
              include: {
                reversal: true,
              },
            },
          },
          orderBy: { startTime: "desc" },
        }),
        prisma.expense.findMany({
          where: {
            OR: [
              { competenceDate: { gte: rangeStart, lte: rangeEnd } },
              { paidAt: { gte: rangeStart, lte: rangeEnd } },
              { status: "PENDING" },
            ],
          },
          include: {
            createdBy: { select: { name: true } },
            paidBy: { select: { name: true } },
          },
          orderBy: [{ dueDate: "asc" }, { competenceDate: "desc" }],
        }),
        prisma.commissionPayout.findMany({
          where: {
            ...barberFilter,
            OR: [
              { paidAt: { gte: rangeStart, lte: rangeEnd } },
              {
                periodStart: { lte: rangeEnd },
                periodEnd: { gte: rangeStart },
              },
            ],
          },
          include: {
            barber: { include: { user: { select: { name: true } } } },
            paidBy: { select: { name: true } },
          },
          orderBy: { paidAt: "desc" },
        }),
        prisma.financialMovement.findMany({
          where: {
            occurredAt: { gte: rangeStart, lte: rangeEnd },
          },
          include: {
            actor: { select: { name: true } },
          },
          orderBy: { occurredAt: "desc" },
          take: 100,
        }),
      ]);

    const barbers = barberRows.map((b) => ({
      id: b.id,
      name: b.user?.name || "Barbeiro",
    }));

    const appointments: FinancialAppointmentInput[] = rawAppointments.map(
      (a) => ({
        id: a.id,
        barberId: a.barberId,
        barberName: a.barber?.user?.name || "Barbeiro",
        clientName: a.client?.name || a.clientContact?.name || "Cliente",
        serviceName: a.service?.name || "Serviço",
        date: a.startTime,
        status: a.status,
        priceCents: a.priceCents,
        commissionCents: a.commissionCents,
        receipt: a.receipt
          ? {
              id: a.receipt.id,
              status:
                a.receipt.status === "REVERTED" ? "REVERTED" : "CONFIRMED",
              paidAmountCents: a.receipt.amountCents,
              method: a.receipt.method,
              confirmedAt: a.receipt.confirmedAt,
              reversal: a.receipt.reversal
                ? {
                    type:
                      a.receipt.reversal.type === "CLIENT_REFUND"
                        ? "CLIENT_REFUND"
                        : "RECORD_CORRECTION",
                    reason: a.receipt.reversal.reason,
                    revertedAt: a.receipt.reversal.revertedAt,
                  }
                : null,
            }
          : null,
      })
    );

    const expenses: ExpenseInput[] = rawExpenses.map((e) => ({
      id: e.id,
      category: e.category as ExpenseCategoryCode,
      description: e.description,
      supplier: e.supplier,
      amountCents: e.amountCents,
      competenceDate: e.competenceDate,
      dueDate: e.dueDate,
      paidAt: e.paidAt,
      paymentMethod: e.paymentMethod,
      status: e.status as ExpenseStatusCode,
      createdByName: e.createdBy?.name || "Admin",
      paidByName: e.paidBy?.name || null,
      canceledReason: e.canceledReason,
    }));

    const payouts: CommissionPayoutInput[] = rawPayouts.map((p) => ({
      id: p.id,
      barberId: p.barberId,
      barberName: p.barber?.user?.name || "Barbeiro",
      amountCents: p.amountCents,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      paidAt: p.paidAt,
      paymentMethod: p.paymentMethod,
      notes: p.notes,
      paidByName: p.paidBy?.name || "Admin",
      status: p.status === "REVERSED" ? "REVERSED" : "PAID",
    }));

    const movements: FinancialMovementInput[] = rawMovements.map((m) => ({
      id: m.id,
      type: m.type as FinancialMovementTypeCode,
      amountCents: m.amountCents,
      occurredAt: m.occurredAt,
      recordedAt: m.recordedAt,
      method: m.method,
      description: m.description,
      reason: m.reason,
      actorName: m.actor?.name || "Sistema",
      appointmentId: m.appointmentId,
      receiptId: m.receiptId,
      expenseId: m.expenseId,
      payoutId: m.payoutId,
    }));

    const statement = buildFinancialStatement({
      appointments,
      expenses,
      payouts,
      rangeStart,
      rangeEnd,
      referenceNow: new Date(),
    });

    const unpaidCompletedAppointments = appointments.filter(
      (a) =>
        a.status === "COMPLETED" &&
        a.date >= rangeStart &&
        a.date <= rangeEnd &&
        (!a.receipt || a.receipt.status === "REVERTED")
    );

    const confirmedReceiptsForAdjustment = appointments.filter(
      (a) => a.receipt != null && a.receipt.status === "CONFIRMED"
    );

    return {
      statement,
      expenses,
      payouts,
      movements,
      unpaidCompletedAppointments,
      confirmedReceiptsForAdjustment,
      barbers,
    };
  }

  async createExpense(params: {
    category: ExpenseCategoryCode;
    description: string;
    supplier?: string | null;
    amountCents: number;
    competenceDate: Date;
    dueDate: Date;
    paidAt?: Date | null;
    paymentMethod?: string | null;
    actorId: string;
  }) {
    await this.ensureFinanceTablesExist();

    const isPaid = Boolean(params.paidAt && params.paymentMethod);

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          category: params.category,
          description: params.description.trim(),
          supplier: params.supplier?.trim() || null,
          amountCents: params.amountCents,
          competenceDate: params.competenceDate,
          dueDate: params.dueDate,
          paidAt: isPaid ? params.paidAt! : null,
          paymentMethod: isPaid ? params.paymentMethod! : null,
          status: isPaid ? "PAID" : "PENDING",
          createdById: params.actorId,
          paidById: isPaid ? params.actorId : null,
        },
      });

      if (isPaid) {
        await tx.financialMovement.create({
          data: {
            type: "EXPENSE_OUT",
            amountCents: expense.amountCents,
            occurredAt: expense.paidAt!,
            method: expense.paymentMethod,
            description: `Despesa paga: ${expense.description}`,
            expenseId: expense.id,
            actorId: params.actorId,
            idempotencyKey: `expense-paid:${expense.id}`,
          },
        });
      }

      return expense;
    });
  }

  async payExpense(params: {
    expenseId: string;
    paymentMethod: string;
    paidAt: Date;
    actorId: string;
  }) {
    await this.ensureFinanceTablesExist();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({
        where: { id: params.expenseId },
      });

      if (!existing) {
        throw new Error("Despesa não encontrada.");
      }
      if (existing.status === "PAID") {
        throw new Error("Esta despesa já consta como paga.");
      }
      if (existing.status === "CANCELED") {
        throw new Error("Não é possível pagar uma despesa cancelada.");
      }

      const updated = await tx.expense.update({
        where: { id: params.expenseId },
        data: {
          status: "PAID",
          paymentMethod: params.paymentMethod,
          paidAt: params.paidAt,
          paidById: params.actorId,
        },
      });

      await tx.financialMovement.create({
        data: {
          type: "EXPENSE_OUT",
          amountCents: updated.amountCents,
          occurredAt: params.paidAt,
          method: params.paymentMethod,
          description: `Baixa de despesa: ${updated.description}`,
          expenseId: updated.id,
          actorId: params.actorId,
          idempotencyKey: `expense-paid:${updated.id}`,
        },
      });

      return updated;
    });
  }

  async cancelExpense(params: {
    expenseId: string;
    reason: string;
    actorId: string;
  }) {
    await this.ensureFinanceTablesExist();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({
        where: { id: params.expenseId },
      });
      if (!existing) {
        throw new Error("Despesa não encontrada.");
      }
      if (existing.status === "CANCELED") {
        throw new Error("Esta despesa já está cancelada.");
      }

      return tx.expense.update({
        where: { id: params.expenseId },
        data: {
          status: "CANCELED",
          canceledReason: params.reason.trim(),
        },
      });
    });
  }

  async createCommissionPayout(params: {
    barberId: string;
    amountCents: number;
    periodStart: Date;
    periodEnd: Date;
    paidAt: Date;
    paymentMethod: string;
    notes?: string | null;
    actorId: string;
  }) {
    await this.ensureFinanceTablesExist();

    return prisma.$transaction(async (tx) => {
      const barber = await tx.barber.findUnique({
        where: { id: params.barberId },
        include: { user: { select: { name: true } } },
      });
      if (!barber) {
        throw new Error("Profissional não encontrado.");
      }

      const payout = await tx.commissionPayout.create({
        data: {
          barberId: params.barberId,
          amountCents: params.amountCents,
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
          paidAt: params.paidAt,
          paymentMethod: params.paymentMethod,
          notes: params.notes?.trim() || null,
          paidById: params.actorId,
          status: "PAID",
        },
      });

      await tx.financialMovement.create({
        data: {
          type: "COMMISSION_PAYOUT_OUT",
          amountCents: payout.amountCents,
          occurredAt: payout.paidAt,
          method: payout.paymentMethod,
          description: `Repasse de comissão: ${barber.user?.name || "Barbeiro"}`,
          reason: payout.notes,
          payoutId: payout.id,
          actorId: params.actorId,
          idempotencyKey: `payout:${payout.id}`,
        },
      });

      return payout;
    });
  }

  async reverseReceiptWithType(params: {
    receiptId: string;
    type: ReversalTypeCode;
    reason: string;
    actorId: string;
  }) {
    await this.ensureFinanceTablesExist();

    return prisma.$transaction(async (tx) => {
      const receipt = await tx.paymentReceipt.findUnique({
        where: { id: params.receiptId },
        include: {
          reversal: true,
          appointment: {
            include: {
              service: { select: { name: true } },
              client: { select: { name: true } },
              clientContact: { select: { name: true } },
            },
          },
        },
      });

      if (!receipt) {
        throw new Error("Comprovante de recebimento não encontrado.");
      }
      if (receipt.status === "REVERTED" || receipt.reversal) {
        throw new Error("Este recebimento já foi estornado ou corrigido.");
      }

      const now = new Date();

      await tx.paymentReceipt.update({
        where: { id: params.receiptId },
        data: { status: "REVERTED" },
      });

      const reversal = await tx.paymentReversal.create({
        data: {
          receiptId: params.receiptId,
          type: params.type,
          reason: params.reason.trim(),
          revertedById: params.actorId,
          revertedAt: now,
        },
      });

      const clientLabel =
        receipt.appointment?.client?.name ||
        receipt.appointment?.clientContact?.name ||
        "Cliente";

      await tx.financialMovement.create({
        data: {
          type:
            params.type === "CLIENT_REFUND"
              ? "CLIENT_REFUND_OUT"
              : "RECORD_CORRECTION",
          amountCents: receipt.amountCents,
          occurredAt: now,
          method: receipt.method,
          description:
            params.type === "CLIENT_REFUND"
              ? `Devolução financeira ao cliente (${clientLabel})`
              : `Correção administrativa de recebimento (${clientLabel})`,
          reason: params.reason.trim(),
          appointmentId: receipt.appointmentId,
          receiptId: receipt.id,
          actorId: params.actorId,
          idempotencyKey: `reversal:${reversal.id}`,
        },
      });

      return reversal;
    });
  }
}
