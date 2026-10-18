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
import type { ScheduleExceptionKind } from "@/core/utils/operations-retention-capacity";
import { reportPeriod } from "@/core/utils/report-period";
import { PrismaOperationsCapacityRepository } from "@/infra/repositories/PrismaOperationsCapacityRepository";
import { revalidatePath } from "next/cache";

const repo = new PrismaOperationsCapacityRepository();

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: authRequiredResponse(), user: null };
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: forbiddenResponse(
        "Apenas administradores podem gerenciar capacidade operacional e vínculos de identidade."
      ),
      user: null,
    };
  }
  return { error: null, user: session.user };
}

export async function getPhaseP3WorkspaceAction(params: {
  period: InsightPeriod;
  barberId?: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: string[];
  customStart?: string;
  customEnd?: string;
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

    const workspace = await repo.getWorkspaceData({
      rangeStart: range.startDate,
      rangeEnd: range.endDate,
      barberId: params.barberId,
      barberIds: params.barberIds,
      serviceIds: params.serviceIds,
      origins: params.origins,
    });

    return actionSuccess({ workspace });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          "Não foi possível carregar os indicadores de capacidade, ocupação e retenção."
        );
  }
}

export async function createScheduleExceptionAction(input: {
  barberId: string;
  kind: ScheduleExceptionKind;
  date: string; // YYYY-MM-DD
  startTimeHHMM: string; // HH:MM
  endTimeHHMM: string; // HH:MM
  reason?: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.barberId) {
      return validationResponse("Selecione o profissional.");
    }
    if (!input.date || !input.startTimeHHMM || !input.endTimeHHMM) {
      return validationResponse("Informe a data, hora inicial e hora final.");
    }

    const startTime = new Date(
      `${input.date}T${input.startTimeHHMM}:00-03:00`
    );
    const endTime = new Date(`${input.date}T${input.endTimeHHMM}:00-03:00`);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime.getTime() <= startTime.getTime()
    ) {
      return validationResponse(
        "Intervalo de horário inválido. A hora final deve ser posterior à hora inicial."
      );
    }

    const created = await repo.createScheduleException({
      barberId: input.barberId,
      kind: input.kind,
      startTime,
      endTime,
      reason: input.reason,
      actorId: user.id,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/barbeiros");
    return actionSuccess({ exception: created });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error
            ? err.message
            : "Erro ao registrar exceção de jornada."
        );
  }
}

export async function deleteScheduleExceptionAction(id: string) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    await repo.deleteScheduleException(id);
    revalidatePath("/admin/dashboard");
    return actionSuccess({});
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Erro ao remover exceção de jornada.");
  }
}

export async function linkClientContactToUserAction(input: {
  clientContactId: string;
  canonicalUserId: string;
  reason?: string;
}) {
  try {
    const { error, user } = await requireAdminSession();
    if (error || !user) return error!;

    if (!input.clientContactId || !input.canonicalUserId) {
      return validationResponse(
        "Selecione o contato manual e a conta de usuário correspondente."
      );
    }

    const link = await repo.linkClientContactToUser({
      clientContactId: input.clientContactId,
      canonicalUserId: input.canonicalUserId,
      reason: input.reason,
      actorId: user.id,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/clientes");
    return actionSuccess({ link });
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse(
          err instanceof Error
            ? err.message
            : "Erro ao vincular identidade do cliente."
        );
  }
}

export async function unlinkClientContactAction(clientContactId: string) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    await repo.unlinkClientContact(clientContactId);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/clientes");
    return actionSuccess({});
  } catch (err) {
    return err instanceof AppError
      ? toStructuredError(err)
      : internalErrorResponse("Erro ao desvincular identidade do cliente.");
  }
}
