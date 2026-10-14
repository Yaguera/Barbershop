import type { AppointmentReportRepository } from "../domain/repositories/AppointmentReportRepository";
import type {
  AdminCalendarResult,
  CalendarFilters,
} from "../domain/repositories/AdminCalendarRepository";
import { ForbiddenError, ValidationError } from "../domain/errors";
import {
  validCalendarDate,
  calendarStatusLabels,
  calendarPaymentLabels,
} from "../utils/admin-calendar";

export interface GetAdminCalendarMetricsRequest {
  adminRole: string;
  year: number;
  month?: number;
  day?: number;
  filters?: CalendarFilters;
}

export type GetAdminCalendarMetricsResponse = AdminCalendarResult;

export class GetAdminCalendarMetricsUseCase {
  constructor(
    private appointmentRepository: Pick<
      AppointmentReportRepository,
      "getAdminCalendarMetrics"
    >,
  ) {}

  async execute(
    request: GetAdminCalendarMetricsRequest,
  ): Promise<GetAdminCalendarMetricsResponse> {
    const { year, month, day, filters = {}, adminRole } = request;
    if (adminRole !== "ADMIN") throw new ForbiddenError();
    if (!filters || typeof filters !== "object" || Array.isArray(filters))
      throw new ValidationError("Filtros inválidos.");
    if (!Number.isInteger(year) || year < 1970 || year > 2100)
      throw new ValidationError("Informe um ano entre 1970 e 2100.");
    if (
      month !== undefined &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    )
      throw new ValidationError("Mês inválido.");
    if (
      day !== undefined &&
      (month === undefined ||
        !Number.isInteger(day) ||
        !validCalendarDate(
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        ))
    )
      throw new ValidationError("Dia inválido.");
    if (
      (filters.status !== undefined &&
        !Object.hasOwn(calendarStatusLabels, filters.status)) ||
      (filters.payment !== undefined &&
        !Object.hasOwn(calendarPaymentLabels, filters.payment)) ||
      (filters.context !== undefined &&
        !["agenda", "cash"].includes(filters.context))
    )
      throw new ValidationError("Filtro de calendário inválido.");
    if (
      filters.barberId !== undefined &&
      (typeof filters.barberId !== "string" ||
        !filters.barberId.length ||
        filters.barberId.length > 128)
    )
      throw new ValidationError("Profissional inválido.");
    if (
      filters.context === "cash" &&
      filters.payment !== undefined &&
      filters.payment !== "paid"
    )
      throw new ValidationError(
        "A visão de caixa mostra somente pagamentos confirmados.",
      );
    return await this.appointmentRepository.getAdminCalendarMetrics(
      year,
      month,
      day,
      {
        ...filters,
        context: filters.context || "agenda",
        payment: filters.context === "cash" ? "paid" : filters.payment || "all",
      },
    );
  }
}
