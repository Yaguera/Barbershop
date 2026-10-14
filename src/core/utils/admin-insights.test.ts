import { describe, expect, it } from "vitest";
import { buildAdminInsights } from "./admin-insights";
import { startOfDay, endOfDay } from "./date-utils";
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
      contributionCents: 1500,
    });
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
  });
  it("conta retornos em dias distintos e mantém contato e cadastro com mesmo nome separados", () => {
    const report = buildAdminInsights(
      range,
      [
        production({ count: 2 }),
        production({ day: "2026-10-10" }),
        production({ clientKey: "CONTACT:c1", clientType: "CONTACT" }),
      ],
      [],
    );
    expect(report).toMatchObject({
      clients: 2,
      recurringClients: 1,
      completed: 4,
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
});
