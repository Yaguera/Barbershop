import { describe, expect, it } from "vitest";
import {
  buildAdminInsights,
  buildInsightComparison,
  computeMetricDelta,
} from "./admin-insights";
import { startOfDay, endOfDay, getYYYYMMDD } from "./date-utils";
import { reportPeriod, resolveComparisonRange } from "./report-period";
import type { ProductionGroup } from "../domain/repositories/AdminInsightsRepository";
const range = {
  startDate: startOfDay("2026-10-01"),
  endDate: endOfDay("2026-10-31"),
};
const production = (extra: Partial<ProductionGroup> = {}): ProductionGroup => ({
  day: "2026-10-03",
  barberId: "b1",
  barberName: "Marcos",
  serviceId: "s1",
  serviceName: "Corte",
  clientKey: "REGISTERED:c1",
  clientName: "João",
  clientType: "REGISTERED",
  count: 1,
  amountCents: 3000,
  commissionCents: 1500,
  pendingCents: 3000,
  ...extra,
});
describe("Admin insights", () => {
  it("separa caixa de produção e não inventa recebimento se nenhum pagamento foi confirmado", () => {
    const report = buildAdminInsights(range, [production()], []);
    expect(report).toMatchObject({
      realizedCents: 3000,
      receivedCents: 0,
      pendingCents: 3000,
      commissionCents: 1500,
      effectiveCommissionRate: 50,
      contributionCents: 1500,
      averageServiceTicketCents: 3000,
      totalDistinctVisits: 1,
      averageVisitTicketCents: 3000,
      cohortReceiptRate: 0,
    });
    expect(typeof report.calculatedAt).toBe("string");
    expect(report.barbers[0]).toMatchObject({
      commissionCents: 1500,
      contributionCents: 1500,
    });
  });
  it("mostra recebimento na data do caixa, inclusive quando não há serviço no período", () => {
    const report = buildAdminInsights(
      range,
      [],
      [
        {
          day: "2026-10-08",
          barberId: "b2",
          barberName: "Chico",
          method: "PIX",
          count: 1,
          amountCents: 5000,
        },
      ],
    );
    expect(report.receivedCents).toBe(5000);
    expect(report.realizedCents).toBe(0);
    expect(
      report.timeline.find((p) => p.key === "2026-10-08")?.receivedCents,
    ).toBe(5000);
    expect(report.barbers[0].completed).toBe(0);
    expect(report.paymentMethods).toEqual([
      {
        method: "PIX",
        label: "Pix",
        count: 1,
        amountCents: 5000,
        percentage: 100,
      },
    ]);
  });
  it("conta retornos em dias distintos, calcula ticket médio por visita e mantém contato e cadastro com mesmo nome separados", () => {
    const report = buildAdminInsights(
      range,
      [
        production({ count: 2, amountCents: 6000, commissionCents: 3000, pendingCents: 0 }),
        production({ day: "2026-10-10", amountCents: 3000, commissionCents: 1500, pendingCents: 3000 }),
        production({ clientKey: "CONTACT:c1", clientType: "CONTACT", amountCents: 3000, commissionCents: 1500, pendingCents: 0 }),
      ],
      [],
    );
    expect(report).toMatchObject({
      clients: 2,
      recurringClients: 1,
      completed: 4,
      realizedCents: 12000,
      pendingCents: 3000,
      averageServiceTicketCents: 3000,
      totalDistinctVisits: 3,
      averageVisitTicketCents: 4000,
      cohortReceiptRate: 75,
    });
    expect(report.topClients[0]).toMatchObject({
      visits: 2,
      appointments: 3,
      averageDays: 7,
    });
  });
  it("usa as comissões registradas e soma exatamente a divisão mesmo com taxas diferentes", () => {
    const report = buildAdminInsights(
      range,
      [production(), production({ day: "2026-10-10", commissionCents: 1200 })],
      [],
    );
    expect(report.barbers[0]).toMatchObject({
      realizedCents: 6000,
      commissionCents: 2700,
      contributionCents: 3300,
    });
    expect(report.commissionCents).toBe(2700);
    expect(report.effectiveCommissionRate).toBe(45);
    expect(report.contributionCents + report.barbers[0].commissionCents).toBe(
      report.realizedCents,
    );
  });
  it("preenche lacunas e preserva o ano nos agrupamentos e limites de detalhamento", () => {
    const monthly = buildAdminInsights(range, [production()], []);
    expect(monthly.timeline).toHaveLength(31);
    expect(monthly.timeline[0]).toMatchObject({
      key: "2026-10-01",
      startDate: "2026-10-01",
      endDate: "2026-10-01",
      realizedCents: 0,
    });
    const yearly = buildAdminInsights(
      { startDate: startOfDay("2025-01-01"), endDate: endOfDay("2026-12-31") },
      [],
      [],
    );
    expect(yearly.granularity).toBe("month");
    expect(yearly.timeline).toHaveLength(24);
    expect(yearly.timeline[1]).toMatchObject({
      key: "2025-02",
      endDate: "2025-02-28",
    });
  });
  it("constrói a matriz Profissional × Serviço com participação no barbeiro e no total", () => {
    const report = buildAdminInsights(
      range,
      [
        production({ barberId: "b1", barberName: "Marcos", serviceId: "s1", serviceName: "Corte", count: 2, amountCents: 6000, commissionCents: 3000 }),
        production({ barberId: "b1", barberName: "Marcos", serviceId: "s2", serviceName: "Barba", count: 1, amountCents: 4000, commissionCents: 2000 }),
        production({ barberId: "b2", barberName: "Chico", serviceId: "s1", serviceName: "Corte", count: 1, amountCents: 10000, commissionCents: 5000 }),
      ],
      [],
    );
    expect(report.barberServiceMatrix).toHaveLength(3);
    const marcosCorte = report.barberServiceMatrix.find(
      (c) => c.barberId === "b1" && c.serviceId === "s1",
    );
    expect(marcosCorte).toMatchObject({
      completed: 2,
      realizedCents: 6000,
      commissionCents: 3000,
      contributionCents: 3000,
      shareOfBarberRate: 60,
      shareOfTotalRate: 30,
    });
  });
  it("não compara mês parcial com mês inteiro silenciosamente e trata ano bissexto (29/02 -> 28/02)", () => {
    const nowMidMonth = new Date("2026-10-18T15:00:00-03:00");
    const currentMonth = reportPeriod("month", nowMidMonth);
    const prevComp = resolveComparisonRange(
      "month",
      currentMonth.startDate,
      currentMonth.endDate,
      "prev_period",
      nowMidMonth,
    );
    expect(prevComp).not.toBeNull();
    expect(getYYYYMMDD(prevComp!.compareStartDate)).toBe("2026-09-01");
    expect(getYYYYMMDD(prevComp!.compareEndDate)).toBe("2026-09-18");
    expect(prevComp!.equivalenceNote).toContain("18 dias");

    const leapDayNow = new Date("2024-02-29T15:00:00-03:00");
    const leapMonth = reportPeriod("month", leapDayNow);
    const yoyLeap = resolveComparisonRange(
      "month",
      leapMonth.startDate,
      leapMonth.endDate,
      "yoy",
      leapDayNow,
    );
    expect(yoyLeap).not.toBeNull();
    expect(getYYYYMMDD(yoyLeap!.compareStartDate)).toBe("2023-02-01");
    expect(getYYYYMMDD(yoyLeap!.compareEndDate)).toBe("2023-02-28");
    expect(yoyLeap!.equivalenceNote).toContain("28/02");
  });
  it("calcula deltas sem divisão por zero e respeita a polaridade de métricas negativas (faltas/cancelamentos)", () => {
    const noMovement = computeMetricDelta(0, 0, "cents", "higher_is_better");
    expect(noMovement.state).toBe("no_movement");
    expect(noMovement.formattedDelta).toBe("Sem movimento");

    const zeroRef = computeMetricDelta(3000, 0, "cents", "higher_is_better");
    expect(zeroRef.state).toBe("no_percent_base");
    expect(zeroRef.percentDelta).toBeNull();
    expect(zeroRef.favorable).toBe(true);

    const rateDelta = computeMetricDelta(75, 50, "rate", "higher_is_better");
    expect(rateDelta.pointsDelta).toBe(25);
    expect(rateDelta.formattedDelta).toBe("+25 p.p.");

    const currentReport = buildAdminInsights(range, [production()], [], 5, 2);
    const refReport = buildAdminInsights(range, [], [], 2, 0);
    const cmp = buildInsightComparison("prev_period", currentReport, refReport);
    expect(cmp.metrics.canceled.absoluteDelta).toBe(3);
    expect(cmp.metrics.canceled.favorable).toBe(false);
    expect(cmp.metrics.noShow.favorable).toBe(false);
  });
});

