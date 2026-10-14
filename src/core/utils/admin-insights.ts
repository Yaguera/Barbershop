import type {
  AdminInsights,
  BarberInsight,
  ClientInsight,
  InsightRange,
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
    { id: string; name: string; count: number; amountCents: number }
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
    barber.completed += group.count;
    barber.realizedCents += group.amountCents;
    barber.commissionCents += group.commissionCents;
    barber.contributionCents += group.amountCents - group.commissionCents;
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
      });
    const service = services.get(group.serviceId)!;
    service.count += group.count;
    service.amountCents += group.amountCents;
  }
  for (const receipt of receipts) {
    const point = timeline.get(keyFor(receipt.day));
    if (point) point.receivedCents += receipt.amountCents;
    professional(receipt.barberId, receipt.barberName).receivedCents +=
      receipt.amountCents;
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
  return {
    startDate,
    endDate,
    periodLabel: formatPeriodRange(range.startDate, range.endDate),
    granularity,
    realizedCents: production.reduce((sum, p) => sum + p.amountCents, 0),
    receivedCents: receipts.reduce((sum, r) => sum + r.amountCents, 0),
    pendingCents: production.reduce((sum, p) => sum + p.pendingCents, 0),
    contributionCents: production.reduce(
      (sum, p) => sum + p.amountCents - p.commissionCents,
      0,
    ),
    completed,
    clients: clientRows.length,
    recurringClients: clientRows.filter((c) => c.visits > 1).length,
    canceled,
    noShow,
    timeline: [...timeline.values()],
    barbers: [...barbers.values()].sort(
      (a, b) => b.completed - a.completed || a.name.localeCompare(b.name),
    ),
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
  };
}
