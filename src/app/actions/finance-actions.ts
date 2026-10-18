"use server";

import { auth } from "@/auth";
import {
  AppError,
  actionSuccess,
  authRequiredResponse,
  forbiddenResponse,
  internalErrorResponse,
  toStructuredError,
  validationResponse,
} from "@/core/domain/errors";
import type { InsightPeriod } from "@/core/domain/repositories/AdminInsightsRepository";
import type {
  ExpenseCategoryCode,
  ReversalTypeCode,
} from "@/core/utils/financial-statement";
import { reportPeriod } from "@/core/utils/report-period";
import { PrismaFinancialLedgerRepository } from "@/infra/repositories/PrismaFinancialLedgerRepository";
import { revalidatePath } from "next/cache";

const repo = new PrismaFinancialLedgerRepository();

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: authRequiredResponse(), user: null };
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: forbiddenResponse("Apenas administradores podem gerenciar o módulo financeiro."),
      user: null,
    };
  }
  return { error: null, user: session.user };
}

export async function getFinancialWorkspaceAction(params: {
  period: InsightPeriod;
  barberId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const range = reportPeriod(
      params.period,
      new Date(),
      params.startDate,
      params.endDate
    );

    const rangeStart = range.startDate ?? new Date(2020, 0, 1);
    const rangeEnd = range.endDate ?? new Date();

    const workspace = await repo.getFinancialWorkspaceData({
      rangeStart,
      rangeEnd,
      barberId: params.barberId,
    });

    return actionSuccess({ workspace });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Não foi possível carregar o módulo financeiro.");
  }
}

export async function createExpenseAction(input: {
  category: ExpenseCategoryCode;
  description: string;
  supplier?: string;
  amountCents: number;
  competenceDate: string;
  dueDate: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.description || input.description.trim().length < 2) {
      return validationResponse("Informe uma descrição válida para a despesa.");
    }
    if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
      return validationResponse("Informe um valor maior que zero para a despesa.");
    }

    const competenceDate = new Date(`${input.competenceDate}T12:00:00`);
    const dueDate = new Date(`${input.dueDate}T12:00:00`);
    if (Number.isNaN(competenceDate.getTime()) || Number.isNaN(dueDate.getTime())) {
      return validationResponse("Datas de competência ou vencimento inválidas.");
    }

    const paidAt = input.paidAt ? new Date(`${input.paidAt}T12:00:00`) : null;

    const expense = await repo.createExpense({
      category: input.category,
      description: input.description,
      supplier: input.supplier,
      amountCents: Math.round(input.amountCents),
      competenceDate,
      dueDate,
      paidAt,
      paymentMethod: input.paymentMethod || null,
      actorId: user.id,
    });

    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/dashboard");
    return actionSuccess({ expense });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error ? err.message : "Erro ao registrar despesa."
        );
  }
}

export async function payExpenseAction(input: {
  expenseId: string;
  paymentMethod: string;
  paidAt?: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.expenseId) {
      return validationResponse("Identificador da despesa ausente.");
    }
    if (!input.paymentMethod) {
      return validationResponse("Selecione a forma de pagamento utilizada.");
    }

    const paidAt = input.paidAt
      ? new Date(`${input.paidAt}T12:00:00`)
      : new Date();

    const expense = await repo.payExpense({
      expenseId: input.expenseId,
      paymentMethod: input.paymentMethod,
      paidAt,
      actorId: user.id,
    });

    revalidatePath("/admin/financeiro");
    return actionSuccess({ expense });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error ? err.message : "Erro ao dar baixa na despesa."
        );
  }
}

export async function cancelExpenseAction(input: {
  expenseId: string;
  reason: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.reason || input.reason.trim().length < 3) {
      return validationResponse("Informe o motivo do cancelamento da despesa.");
    }

    const expense = await repo.cancelExpense({
      expenseId: input.expenseId,
      reason: input.reason,
      actorId: user.id,
    });

    revalidatePath("/admin/financeiro");
    return actionSuccess({ expense });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error ? err.message : "Erro ao cancelar despesa."
        );
  }
}

export async function createCommissionPayoutAction(input: {
  barberId: string;
  amountCents: number;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  paymentMethod: string;
  notes?: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.barberId) {
      return validationResponse("Selecione o barbeiro para o repasse.");
    }
    if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
      return validationResponse("O valor do repasse deve ser maior que zero.");
    }
    if (!input.paymentMethod) {
      return validationResponse("Selecione a forma de pagamento do repasse.");
    }

    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    const paidAt = input.paidAt
      ? new Date(`${input.paidAt}T12:00:00`)
      : new Date();

    const payout = await repo.createCommissionPayout({
      barberId: input.barberId,
      amountCents: Math.round(input.amountCents),
      periodStart: Number.isNaN(periodStart.getTime()) ? new Date() : periodStart,
      periodEnd: Number.isNaN(periodEnd.getTime()) ? new Date() : periodEnd,
      paidAt,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      actorId: user.id,
    });

    revalidatePath("/admin/financeiro");
    return actionSuccess({ payout });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error ? err.message : "Erro ao registrar repasse de comissão."
        );
  }
}

export async function reverseReceiptWithTypeAction(input: {
  receiptId: string;
  type: ReversalTypeCode;
  reason: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.receiptId) {
      return validationResponse("Comprovante de recebimento não informado.");
    }
    if (!input.reason || input.reason.trim().length < 5) {
      return validationResponse(
        "Informe o motivo detalhado (mínimo de 5 caracteres) para auditoria."
      );
    }

    const reversal = await repo.reverseReceiptWithType({
      receiptId: input.receiptId,
      type: input.type,
      reason: input.reason,
      actorId: user.id,
    });

    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/dashboard");
    return actionSuccess({ reversal });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error ? err.message : "Erro ao registrar ajuste/devolução."
        );
  }
}
