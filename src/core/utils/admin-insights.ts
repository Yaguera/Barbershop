import type {
  AdminInsights,
  BarberInsight,
  BarberServiceCell,
  ClientInsight,
  InsightComparisonMode,
  InsightComparisonSummary,
  InsightRange,
  MetricComparisonDelta,
  MetricPolarity,
  PaymentMethodInsight,
  ProductionGroup,
  ReceiptGroup,
  TimelinePoint,
} from "../domain/repositories/AdminInsightsRepository";
import { getYYYYMMDD } from "./date-utils";
import { formatPeriodRange } from "./report-period";

const nextDay = (date: string) =>
  getYYYYMMDD(
    new Date(new Date(`${date}T12:00:00-03:00`).getTime() + 86400000),
  );

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "Pix",
  MONEY: "Dinheiro",
  CARD: "Cartão",
};

const formatBrlFromCents = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);

export function computeMetricDelta(
  current: number,
  reference: number,
  unit: "cents" | "count" | "rate",
  polarity: MetricPolarity = "higher_is_better",
): MetricComparisonDelta {
  const absoluteDelta =
    unit === "rate"
      ? Math.round((current - reference) * 10) / 10
      : current - reference;

  const formatVal = (val: number) => {
    if (unit === "cents") return formatBrlFromCents(val);
    if (unit === "rate") return `${val.toFixed(1).replace(".0", "")}%`;
    return String(val);
  };

  if (current === 0 && reference === 0) {
    return {
      current,
      reference,
      absoluteDelta: 0,
      percentDelta: 0,
      pointsDelta: unit === "rate" ? 0 : null,
      state: "no_movement",
      favorable: null,
      formattedReference: formatVal(reference),
      formattedDelta: "Sem movimento",
    };
  }

  if (unit === "rate") {
    const pointsDelta = Math.round((current - reference) * 10) / 10;
    const sign = pointsDelta > 0 ? "+" : "";
    const state =
      pointsDelta > 0 ? "positive" : pointsDelta < 0 ? "negative" : "neutral";
    const favorable =
      polarity === "neutral" || pointsDelta === 0
        ? null
        : polarity === "higher_is_better"
          ? pointsDelta > 0
          : pointsDelta < 0;
    return {
      current,
      reference,
      absoluteDelta: pointsDelta,
      percentDelta:
        reference > 0
          ? Math.round(((current - reference) / reference) * 1000) / 10
          : null,
      pointsDelta,
      state,
      favorable,
      formattedReference: formatVal(reference),
      formattedDelta:
        pointsDelta === 0
          ? "Estável (0 p.p.)"
          : `${sign}${pointsDelta.toFixed(1).replace(".0", "")} p.p.`,
    };
  }

  if (reference === 0 && current > 0) {
    const favorable =
      polarity === "neutral" ? null : polarity === "higher_is_better";
    return {
      current,
      reference,
      absoluteDelta,
      percentDelta: null,
      pointsDelta: null,
      state: "no_percent_base",
      favorable,
      formattedReference: formatVal(reference),
      formattedDelta: `+${formatVal(absoluteDelta)} (Sem base %)`,
    };
  }

  const percentDelta =
    reference > 0
      ? Math.round(((current - reference) / reference) * 1000) / 10
      : null;
  const state =
    absoluteDelta > 0
      ? "positive"
      : absoluteDelta < 0
        ? "negative"
        : "neutral";
  const favorable =
    polarity === "neutral" || absoluteDelta === 0
      ? null
      : polarity === "higher_is_better"
        ? absoluteDelta > 0
        : absoluteDelta < 0;
  const sign = absoluteDelta > 0 ? "+" : "";
  const pctStr =
    percentDelta !== null
      ? `${sign}${percentDelta.toFixed(1).replace(".0", "")}%`
      : "";
  const absStr =
    unit === "cents"
      ? `${sign}${formatBrlFromCents(absoluteDelta)}`
      : `${sign}${absoluteDelta}`;

  return {
    current,
    reference,
    absoluteDelta,
    percentDelta,
    pointsDelta: null,
    state,
    favorable,
    formattedReference: formatVal(reference),
    formattedDelta:
      absoluteDelta === 0 ? "Estável (0%)" : `${pctStr} (${absStr})`,
  };
}

export function buildInsightComparison(
  mode: InsightComparisonMode,
  current: AdminInsights,
  reference: AdminInsights,
  equivalenceNote?: string,
): InsightComparisonSummary {
  return {
    mode,
    startDate: reference.startDate,
    endDate: reference.endDate,
    periodLabel: reference.periodLabel,
    equivalenceNote,
    metrics: {
      receivedCents: computeMetricDelta(
        current.receivedCents,
        reference.receivedCents,
        "cents",
        "higher_is_better",
      ),
      realizedCents: computeMetricDelta(
        current.realizedCents,
        reference.realizedCents,
        "cents",
        "higher_is_better",
      ),
      pendingCents: computeMetricDelta(
        current.pendingCents,
        reference.pendingCents,
        "cents",
        "lower_is_better",
      ),
      commissionCents: computeMetricDelta(
        current.commissionCents,
        reference.commissionCents,
        "cents",
        "neutral",
      ),
      contributionCents: computeMetricDelta(
        current.contributionCents,
        reference.contributionCents,
        "cents",
        "higher_is_better",
      ),
      effectiveCommissionRate: computeMetricDelta(
        current.effectiveCommissionRate,
        reference.effectiveCommissionRate,
        "rate",
        "neutral",
      ),
      completed: computeMetricDelta(
        current.completed,
        reference.completed,
        "count",
        "higher_is_better",
      ),
      averageServiceTicketCents: computeMetricDelta(
        current.averageServiceTicketCents,
        reference.averageServiceTicketCents,
        "cents",
        "higher_is_better",
      ),
      clients: computeMetricDelta(
        current.clients,
        reference.clients,
        "count",
        "higher_is_better",
      ),
      averageVisitTicketCents: computeMetricDelta(
        current.averageVisitTicketCents,
        reference.averageVisitTicketCents,
        "cents",
        "higher_is_better",
      ),
      cohortReceiptRate: computeMetricDelta(
        current.cohortReceiptRate,
        reference.cohortReceiptRate,
        "rate",
        "higher_is_better",
      ),
      canceled: computeMetricDelta(
        current.canceled,
        reference.canceled,
        "count",
        "lower_is_better",
      ),
      noShow: computeMetricDelta(
        current.noShow,
        reference.noShow,
        "count",
        "lower_is_better",
      ),
    },
    timeline: reference.timeline,
  };
}

export function buildAdminInsights(
  range: InsightRange,
  production: ProductionGroup[],
  receipts: ReceiptGroup[],
  canceled = 0,
  noShow = 0,
): AdminInsights {
  const startDate = getYYYYMMDD(range.startDate);
  const endDate = getYYYYMMDD(range.endDate);
  const activity = [
    ...production.map((p) => p.day),
    ...receipts.map((r) => r.day),
  ].sort();
  const firstDay =
    range.startDate.getTime() === 0 ? activity[0] || endDate : startDate;
  const span =
    (new Date(`${endDate}T12:00:00Z`).getTime() -
      new Date(`${firstDay}T12:00:00Z`).getTime()) /
    86400000;
  const granularity = span <= 62 ? "day" : span <= 1827 ? "month" : "year";
  const keyFor = (day: string) =>
    day.slice(0, granularity === "day" ? 10 : granularity === "month" ? 7 : 4);
  const timeline = new Map<string, TimelinePoint>();
  if (range.startDate.getTime() !== 0 || activity.length) {
    let day = firstDay;
    while (day <= endDate) {
      const key = keyFor(day);
      if (!timeline.has(key)) {
        let last: string;
        if (granularity === "day") last = day;
        else if (granularity === "month")
          last = getYYYYMMDD(
            new Date(
              Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0, 15),
            ),
          );
        else last = `${day.slice(0, 4)}-12-31`;
        const bucketEnd = last < endDate ? last : endDate;
        const label =
          granularity === "day"
            ? `${day.slice(8, 10)}/${day.slice(5, 7)}`
            : granularity === "month"
              ? `${day.slice(5, 7)}/${day.slice(0, 4)}`
              : day.slice(0, 4);
        timeline.set(key, {
          key,
          label,
          startDate: day,
          endDate: bucketEnd,
          realizedCents: 0,
          receivedCents: 0,
          completed: 0,
        });
        day = nextDay(bucketEnd);
      } else day = nextDay(day);
    }
  }
  const barbers = new Map<string, BarberInsight>();
  const customers = new Map<
    string,
    { row: ClientInsight; days: Set<string> }
  >();
  const services = new Map<
    string,
    {
      id: string;
      name: string;
      count: number;
      amountCents: number;
      commissionCents: number;
      contributionCents: number;
    }
  >();
  const matrixMap = new Map<
    string,
    {
      barberId: string;
      barberName: string;
      serviceId: string;
      serviceName: string;
      completed: number;
      realizedCents: number;
      commissionCents: number;
      contributionCents: number;
    }
  >();
  const paymentMethodsMap = new Map<
    string,
    { method: string; label: string; count: number; amountCents: number }
  >();

  const professional = (id: string, name: string) => {
    if (!barbers.has(id))
      barbers.set(id, {
        id,
        name,
        completed: 0,
        realizedCents: 0,
        receivedCents: 0,
        commissionCents: 0,
        contributionCents: 0,
      });
    return barbers.get(id)!;
  };
  for (const group of production) {
    const point = timeline.get(keyFor(group.day));
    if (point) {
      point.realizedCents += group.amountCents;
      point.completed += group.count;
    }
    const barber = professional(group.barberId, group.barberName);
    const contribution = group.amountCents - group.commissionCents;
    barber.completed += group.count;
    barber.realizedCents += group.amountCents;
    barber.commissionCents += group.commissionCents;
    barber.contributionCents += contribution;

    const matrixKey = `${group.barberId}::${group.serviceId}`;
    if (!matrixMap.has(matrixKey)) {
      matrixMap.set(matrixKey, {
        barberId: group.barberId,
        barberName: group.barberName,
        serviceId: group.serviceId,
        serviceName: group.serviceName,
        completed: 0,
        realizedCents: 0,
        commissionCents: 0,
        contributionCents: 0,
      });
    }
    const cell = matrixMap.get(matrixKey)!;
    cell.completed += group.count;
    cell.realizedCents += group.amountCents;
    cell.commissionCents += group.commissionCents;
    cell.contributionCents += contribution;

    if (!customers.has(group.clientKey))
      customers.set(group.clientKey, {
        row: {
          key: group.clientKey,
          id: group.clientKey.slice(group.clientKey.indexOf(":") + 1),
          type: group.clientType,
          name: group.clientName,
          visits: 0,
          appointments: 0,
          realizedCents: 0,
          lastVisit: group.day,
          averageDays: null,
        },
        days: new Set(),
      });
    const client = customers.get(group.clientKey)!;
    client.days.add(group.day);
    client.row.appointments += group.count;
    client.row.realizedCents += group.amountCents;
    if (group.day > client.row.lastVisit) client.row.lastVisit = group.day;
    if (!services.has(group.serviceId))
      services.set(group.serviceId, {
        id: group.serviceId,
        name: group.serviceName,
        count: 0,
        amountCents: 0,
        commissionCents: 0,
        contributionCents: 0,
      });
    const service = services.get(group.serviceId)!;
    service.count += group.count;
    service.amountCents += group.amountCents;
    service.commissionCents += group.commissionCents;
    service.contributionCents += contribution;
  }
  for (const receipt of receipts) {
    const point = timeline.get(keyFor(receipt.day));
    if (point) point.receivedCents += receipt.amountCents;
    professional(receipt.barberId, receipt.barberName).receivedCents +=
      receipt.amountCents;

    const methodKey = receipt.method || "PIX";
    if (!paymentMethodsMap.has(methodKey)) {
      paymentMethodsMap.set(methodKey, {
        method: methodKey,
        label: PAYMENT_METHOD_LABELS[methodKey] || methodKey,
        count: 0,
        amountCents: 0,
      });
    }
    const pm = paymentMethodsMap.get(methodKey)!;
    pm.count += receipt.count ?? 1;
    pm.amountCents += receipt.amountCents;
  }
  const clientRows = Array.from(customers.values()).map(({ row, days }) => {
    const ordered = [...days].sort();
    const gap =
      ordered.length > 1
        ? Math.round(
            (new Date(ordered.at(-1)!).getTime() -
              new Date(ordered[0]).getTime()) /
              86400000 /
              (ordered.length - 1),
          )
        : null;
    return { ...row, visits: days.size, averageDays: gap };
  });
  const completed = production.reduce((sum, p) => sum + p.count, 0);
  const realizedCents = production.reduce((sum, p) => sum + p.amountCents, 0);
  const receivedCents = receipts.reduce((sum, r) => sum + r.amountCents, 0);
  const pendingCents = production.reduce((sum, p) => sum + p.pendingCents, 0);
  const commissionCents = production.reduce(
    (sum, p) => sum + p.commissionCents,
    0,
  );
  const contributionCents = realizedCents - commissionCents;
  const effectiveCommissionRate =
    realizedCents > 0
      ? Math.round((commissionCents / realizedCents) * 1000) / 10
      : 0;
  const averageServiceTicketCents =
    completed > 0 ? Math.round(realizedCents / completed) : 0;
  const totalDistinctVisits = clientRows.reduce((sum, c) => sum + c.visits, 0);
  const averageVisitTicketCents =
    totalDistinctVisits > 0
      ? Math.round(realizedCents / totalDistinctVisits)
      : 0;
  const liquidatedCohortCents = Math.max(0, realizedCents - pendingCents);
  const cohortReceiptRate =
    realizedCents > 0
      ? Math.round((liquidatedCohortCents / realizedCents) * 1000) / 10
      : 0;

  const barberServiceMatrix: BarberServiceCell[] = Array.from(
    matrixMap.values(),
  )
    .map((cell) => {
      const barberTotal = barbers.get(cell.barberId)?.realizedCents || 0;
      return {
        ...cell,
        effectiveCommissionRate:
          cell.realizedCents > 0
            ? Math.round((cell.commissionCents / cell.realizedCents) * 1000) /
              10
            : 0,
        shareOfBarberRate:
          barberTotal > 0
            ? Math.round((cell.realizedCents / barberTotal) * 1000) / 10
            : 0,
        shareOfTotalRate:
          realizedCents > 0
            ? Math.round((cell.realizedCents / realizedCents) * 1000) / 10
            : 0,
      };
    })
    .sort(
      (a, b) =>
        b.realizedCents - a.realizedCents ||
        b.completed - a.completed ||
        a.barberName.localeCompare(b.barberName),
    );

  const paymentMethods: PaymentMethodInsight[] = Array.from(
    paymentMethodsMap.values(),
  )
    .map((pm) => ({
      ...pm,
      percentage:
        receivedCents > 0
          ? Math.round((pm.amountCents / receivedCents) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return {
    startDate,
    endDate,
    periodLabel: formatPeriodRange(range.startDate, range.endDate),
    calculatedAt: new Date().toISOString(),
    granularity,
    realizedCents,
    receivedCents,
    pendingCents,
    commissionCents,
    contributionCents,
    effectiveCommissionRate,
    averageServiceTicketCents,
    totalDistinctVisits,
    averageVisitTicketCents,
    cohortReceiptRate,
    completed,
    clients: clientRows.length,
    recurringClients: clientRows.filter((c) => c.visits > 1).length,
    canceled,
    noShow,
    timeline: [...timeline.values()],
    barbers: [...barbers.values()].sort(
      (a, b) => b.completed - a.completed || a.name.localeCompare(b.name),
    ),
    barberServiceMatrix,
    paymentMethods,
    topClients: clientRows
      .sort(
        (a, b) =>
          b.visits - a.visits ||
          b.appointments - a.appointments ||
          a.key.localeCompare(b.key),
      )
      .slice(0, 10),
    services: [...services.values()]
      .map((s) => ({
        ...s,
        percentage: completed
          ? Math.round((s.count / completed) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.count - a.count),
    appliedFilters: {
      barberIds:
        range.barberIds ?? (range.barberId ? [range.barberId] : []),
      serviceIds: range.serviceIds ?? [],
      origins: range.origins ?? [],
      paymentMethods: range.paymentMethods ?? [],
    },
  };
}

