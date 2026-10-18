"use server";
import { auth } from "@/auth";
import {
  AppError,
  internalErrorResponse,
  actionSuccess,
  authRequiredResponse,
  toStructuredError,
} from "@/core/domain/errors";
import type {
  InsightDetailFilter,
  InsightFilterInput,
  InsightPeriod,
} from "@/core/domain/repositories/AdminInsightsRepository";
import { GetAdminInsightsUseCase } from "@/core/usecases/GetAdminInsightsUseCase";
import { PrismaAdminInsightsRepository } from "@/infra/repositories/PrismaAdminInsightsRepository";

export async function getAdminInsightsAction(
  periodOrFilter: InsightPeriod | InsightFilterInput,
  barberId?: string,
) {
  try {
    const session = await auth();
    if (!session?.user) return authRequiredResponse();
    return actionSuccess({
      report: await new GetAdminInsightsUseCase(
        new PrismaAdminInsightsRepository(),
      ).overview(session.user.role, periodOrFilter, barberId),
    });
  } catch (error) {
    return error instanceof AppError
      ? toStructuredError(error)
      : internalErrorResponse(
          "Não foi possível carregar as análises. Tente novamente.",
        );
  }
}

export async function getAdminInsightDetailsAction(
  filter: InsightDetailFilter,
) {
  try {
    const session = await auth();
    if (!session?.user) return authRequiredResponse();
    return actionSuccess({
      details: await new GetAdminInsightsUseCase(
        new PrismaAdminInsightsRepository(),
      ).details(session.user.role, filter),
    });
  } catch (error) {
    return error instanceof AppError
      ? toStructuredError(error)
      : internalErrorResponse(
          "Não foi possível carregar os atendimentos. Tente novamente.",
        );
  }
}

