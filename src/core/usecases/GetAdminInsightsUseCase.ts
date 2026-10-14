import { ForbiddenError, ValidationError } from "../domain/errors";
import type {
  AdminInsightsRepository,
  InsightDetailFilter,
  InsightPeriod,
  InsightRange,
} from "../domain/repositories/AdminInsightsRepository";
import { endOfDay, getYYYYMMDD, startOfDay } from "../utils/date-utils";
import { reportPeriod } from "../utils/report-period";

export class GetAdminInsightsUseCase {
  constructor(private readonly repository: AdminInsightsRepository) {}
  private range(
    role: string,
    period: InsightPeriod,
    barberId?: string,
  ): InsightRange {
    if (role !== "ADMIN") throw new ForbiddenError();
    if (!["today", "week", "month", "year", "all"].includes(period))
      throw new ValidationError("Período inválido.");
    if (
      barberId !== undefined &&
      (typeof barberId !== "string" || barberId.length > 128)
    )
      throw new ValidationError("Profissional inválido.");
    return {
      ...reportPeriod(period),
      barberId: barberId === "all" ? undefined : barberId,
    };
  }
  overview(role: string, period: InsightPeriod, barberId?: string) {
    return this.repository.overview(this.range(role, period, barberId));
  }
  details(role: string, filter: InsightDetailFilter) {
    const range = this.range(role, filter.period, filter.barberId);
    if (
      !["completed", "received", "pending", "canceled", "no_show"].includes(
        filter.kind,
      )
    )
      throw new ValidationError("Indicador inválido.");
    if (
      filter.page !== undefined &&
      (!Number.isInteger(filter.page) ||
        filter.page < 1 ||
        filter.page > 100000)
    )
      throw new ValidationError("Página inválida.");
    for (const id of [filter.serviceId, filter.clientId])
      if (
        id !== undefined &&
        (typeof id !== "string" || !id.length || id.length > 128)
      )
        throw new ValidationError("Filtro inválido.");
    if (
      Boolean(filter.clientId) !== Boolean(filter.clientType) ||
      (filter.clientType &&
        !["REGISTERED", "CONTACT"].includes(filter.clientType))
    )
      throw new ValidationError("Cliente inválido.");
    if (Boolean(filter.startDate) !== Boolean(filter.endDate))
      throw new ValidationError("Informe o início e o fim do intervalo.");
    if (filter.startDate && filter.endDate) {
      for (const date of [filter.startDate, filter.endDate]) {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(startOfDay(date).getTime()) ||
          getYYYYMMDD(startOfDay(date)) !== date
        )
          throw new ValidationError("Data inválida.");
      }
      const start = startOfDay(filter.startDate),
        end = endOfDay(filter.endDate);
      if (start > end || start < range.startDate || end > range.endDate)
        throw new ValidationError("Intervalo fora do período selecionado.");
      range.startDate = start;
      range.endDate = end;
    }
    return this.repository.details(range, filter);
  }
}
