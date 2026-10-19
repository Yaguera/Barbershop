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
import { reportPeriod } from "@/core/utils/report-period";
import type { GoalMetricCode } from "@/core/utils/telemetry-goals-projection-export";
import { PrismaTelemetryGoalsRepository } from "@/infra/repositories/PrismaTelemetryGoalsRepository";
import { revalidatePath } from "next/cache";

const repo = new PrismaTelemetryGoalsRepository();

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: authRequiredResponse(), user: null };
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: forbiddenResponse(
        "Acesso negado: apenas administradores podem consultar metas, funil ou exportar relatórios gerais."
      ),
      user: null,
    };
  }
  return { error: null, user: session.user };
}

/**
 * Registra eventos internos deduplicados do funil de agendamento online
 * (sem dados pessoais, e-mail, nome ou telefone).
 */
export async function trackBookingTelemetryAction(input: {
  eventName: "booking_started" | "booking_details_selected" | "appointment_created";
  journeyId: string;
  serviceId?: string;
  barberId?: string;
  appointmentId?: string;
  channel?: "ONLINE" | "WHATSAPP" | "WALK_IN";
}) {
  try {
    if (!input.journeyId || input.journeyId.length > 100) {
      return actionSuccess({ recorded: false });
    }

    const session = await auth();
    const actorRole = session?.user?.role || "CLIENT";
    const channel = input.channel || "ONLINE";

    const idempotencyKey =
      input.eventName === "appointment_created" && input.appointmentId
        ? `telemetry:appointment_created:${input.appointmentId}`
        : `telemetry:${input.eventName}:${input.journeyId}`;

    await repo.recordTelemetryEvent({
      eventName: input.eventName,
      journeyId: input.journeyId,
      channel,
      actorRole,
      serviceId: input.serviceId || null,
      barberId: input.barberId || null,
      appointmentId: input.appointmentId || null,
      idempotencyKey,
    });

    return actionSuccess({ recorded: true });
  } catch {
    return actionSuccess({ recorded: false });
  }
}

export async function getPhaseP4WorkspaceAction(params: {
  period: InsightPeriod;
  barberId?: string;
  barberIds?: string[];
  customStart?: string;
  customEnd?: string;
  actuals: {
    receivedRevenueCents: number;
    realizedProductionCents: number;
    barbershopContributionCents: number;
    occupancyRatePercent: number | null;
    noShowRatePercent: number | null;
  };
}) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const range = reportPeriod(
      params.period,
      new Date(),
      params.customStart,
      params.customEnd
    );

    const workspace = await repo.getPhaseP4WorkspaceData({
      rangeStart: range.startDate,
      rangeEnd: range.endDate,
      period: params.period,
      barberId: params.barberId,
      barberIds: params.barberIds,
      actuals: params.actuals,
    });

    return actionSuccess({ workspace });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          "Não foi possível carregar o painel de metas, projeções e funil digital."
        );
  }
}

export async function upsertManagementGoalAction(input: {
  metricCode: GoalMetricCode;
  monthKey: string;
  barberId?: string;
  targetValue: number;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!/^\d{4}-\d{2}$/.test(input.monthKey)) {
      return validationResponse("Mês de referência inválido (use YYYY-MM).");
    }
    if (!Number.isFinite(input.targetValue) || input.targetValue <= 0) {
      return validationResponse("Informe um valor de meta maior que zero.");
    }

    const goal = await repo.upsertManagementGoal({
      metricCode: input.metricCode,
      monthKey: input.monthKey,
      barberId: input.barberId,
      targetValue: input.targetValue,
      actorId: user.id,
    });

    revalidatePath("/admin/dashboard");
    return actionSuccess({ goal });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Erro ao salvar meta gerencial.");
  }
}

export async function deleteManagementGoalAction(input: {
  metricCode: GoalMetricCode;
  monthKey: string;
  barberId?: string;
}) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    await repo.deleteManagementGoal({
      metricCode: input.metricCode,
      monthKey: input.monthKey,
      barberId: input.barberId,
    });

    revalidatePath("/admin/dashboard");
    return actionSuccess({});
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Erro ao remover meta gerencial.");
  }
}

export async function exportAnalyticalCsvAction(params: {
  period: InsightPeriod;
  filterSignature: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: string[];
  customStart?: string;
  customEnd?: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    const range = reportPeriod(
      params.period,
      new Date(),
      params.customStart,
      params.customEnd
    );

    const exported = await repo.exportAnalyticalCsv({
      rangeStart: range.startDate,
      rangeEnd: range.endDate,
      periodLabel: range.label,
      filterSignature: params.filterSignature,
      barberIds: params.barberIds,
      serviceIds: params.serviceIds,
      origins: params.origins,
      actorRole: user.role || "ADMIN",
    });

    return actionSuccess({ exported });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Não foi possível exportar o relatório CSV.");
  }
}
