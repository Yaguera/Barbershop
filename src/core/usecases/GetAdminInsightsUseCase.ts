import { ForbiddenError, ValidationError } from "../domain/errors";
import type {
  AdminInsightsRepository,
  BookingOriginFilter,
  InsightComparisonMode,
  InsightDetailFilter,
  InsightFilterInput,
  InsightPeriod,
  InsightRange,
  PaymentMethodFilter,
} from "../domain/repositories/AdminInsightsRepository";
import { endOfDay, getYYYYMMDD, startOfDay } from "../utils/date-utils";
import { reportPeriod, resolveComparisonRange } from "../utils/report-period";

const VALID_PERIODS: InsightPeriod[] = [
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

const VALID_COMPARE_MODES: InsightComparisonMode[] = [
  "none",
  "prev_period",
  "yoy",
  "custom",
];

const VALID_ORIGINS: BookingOriginFilter[] = [
  "ONLINE",
  "WHATSAPP",
  "WALK_IN",
];

const VALID_PAYMENT_METHODS: PaymentMethodFilter[] = ["MONEY", "PIX", "CARD"];

function validateDateStr(date: string, label = "Data inválida."): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(startOfDay(date).getTime()) ||
    getYYYYMMDD(startOfDay(date)) !== date
  ) {
    throw new ValidationError(label);
  }
}

function validateIdList(ids: string[] | undefined, label: string): string[] {
  if (!ids || ids.length === 0) return [];
  if (!Array.isArray(ids) || ids.length > 50) {
    throw new ValidationError(label);
  }
  const clean: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !id.trim() || id.length > 128) {
      throw new ValidationError(label);
    }
    if (id !== "all" && !clean.includes(id)) {
      clean.push(id);
    }
  }
  return clean;
}

export class GetAdminInsightsUseCase {
  constructor(private readonly repository: AdminInsightsRepository) {}

  private range(
    role: string,
    periodOrInput: InsightPeriod | InsightFilterInput,
    barberId?: string,
  ): InsightRange {
    if (role !== "ADMIN") throw new ForbiddenError();

    const input: InsightFilterInput =
      typeof periodOrInput === "string"
        ? { period: periodOrInput, barberId }
        : periodOrInput;

    if (!VALID_PERIODS.includes(input.period)) {
      throw new ValidationError("Período inválido.");
    }

    if (input.period === "custom") {
      if (!input.customStart || !input.customEnd) {
        throw new ValidationError(
          "Informe a data inicial e a data final do período personalizado.",
        );
      }
      validateDateStr(input.customStart, "Data inicial personalizada inválida.");
      validateDateStr(input.customEnd, "Data final personalizada inválida.");
      if (startOfDay(input.customStart) > endOfDay(input.customEnd)) {
        throw new ValidationError(
          "A data inicial não pode ser posterior à data final.",
        );
      }
    }

    if (
      input.barberId !== undefined &&
      (typeof input.barberId !== "string" || input.barberId.length > 128)
    ) {
      throw new ValidationError("Profissional inválido.");
    }

    const barberIds = validateIdList(
      input.barberIds ??
        (input.barberId && input.barberId !== "all" ? [input.barberId] : []),
      "Profissional inválido.",
    );
    const serviceIds = validateIdList(input.serviceIds, "Serviço inválido.");

    const origins: BookingOriginFilter[] = [];
    if (input.origins && input.origins.length > 0) {
      for (const o of input.origins) {
        if (!VALID_ORIGINS.includes(o)) {
          throw new ValidationError("Origem de agendamento inválida.");
        }
        if (!origins.includes(o)) origins.push(o);
      }
    }

    const paymentMethods: PaymentMethodFilter[] = [];
    if (input.paymentMethods && input.paymentMethods.length > 0) {
      for (const m of input.paymentMethods) {
        if (!VALID_PAYMENT_METHODS.includes(m)) {
          throw new ValidationError("Forma de pagamento inválida.");
        }
        if (!paymentMethods.includes(m)) paymentMethods.push(m);
      }
    }

    const compareMode: InsightComparisonMode = input.compareMode ?? "none";
    if (!VALID_COMPARE_MODES.includes(compareMode)) {
      throw new ValidationError("Modo de comparação inválido.");
    }

    if (compareMode === "custom") {
      if (!input.compareStart || !input.compareEnd) {
        throw new ValidationError(
          "Informe o início e o fim do período de comparação personalizado.",
        );
      }
      validateDateStr(
        input.compareStart,
        "Data inicial de comparação inválida.",
      );
      validateDateStr(input.compareEnd, "Data final de comparação inválida.");
      if (startOfDay(input.compareStart) > endOfDay(input.compareEnd)) {
        throw new ValidationError(
          "A data inicial da comparação não pode ser posterior à data final.",
        );
      }
    }

    const basePeriod = reportPeriod(
      input.period,
      new Date(),
      input.customStart,
      input.customEnd,
    );

    const comp = resolveComparisonRange(
      input.period,
      basePeriod.startDate,
      basePeriod.endDate,
      compareMode,
      new Date(),
      input.compareStart,
      input.compareEnd,
    );

    return {
      startDate: basePeriod.startDate,
      endDate: basePeriod.endDate,
      period: input.period,
      barberId: barberIds.length === 1 ? barberIds[0] : undefined,
      barberIds,
      serviceIds,
      origins,
      paymentMethods,
      compareMode,
      compareStartDate: comp?.compareStartDate,
      compareEndDate: comp?.compareEndDate,
      comparisonNote: comp?.equivalenceNote,
    };
  }

  overview(
    role: string,
    periodOrInput: InsightPeriod | InsightFilterInput,
    barberId?: string,
  ) {
    return this.repository.overview(this.range(role, periodOrInput, barberId));
  }

  details(role: string, filter: InsightDetailFilter) {
    const range = this.range(role, {
      period: filter.period,
      customStart: filter.customStart,
      customEnd: filter.customEnd,
      barberId: filter.barberId,
      barberIds: filter.barberIds,
      serviceIds:
        filter.serviceIds ?? (filter.serviceId ? [filter.serviceId] : []),
      origins: filter.origins,
      paymentMethods: filter.paymentMethods,
    });
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
        validateDateStr(date);
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

