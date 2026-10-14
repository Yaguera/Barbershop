import { describe, expect, it, vi } from "vitest";
import {
  GetAdminCalendarMetricsUseCase,
  type GetAdminCalendarMetricsRequest,
} from "./GetAdminCalendarMetricsUseCase";
describe("Admin calendar authorization and validation", () => {
  it.each(["CLIENT", "BARBER", "RECEPTIONIST", ""])(
    "impede consulta por %s",
    async (adminRole) => {
      const repository = { getAdminCalendarMetrics: vi.fn() };
      await expect(
        new GetAdminCalendarMetricsUseCase(repository).execute({
          adminRole,
          year: 2026,
        }),
      ).rejects.toMatchObject({ status: 403 });
      expect(repository.getAdminCalendarMetrics).not.toHaveBeenCalled();
    },
  );
  it.each([
    { year: 1969 },
    { year: 2101 },
    { year: 2026.5 },
    { month: 13 },
    { month: 0 },
    { month: 1.5 },
    { day: 1 },
    { month: 2, day: 30 },
    { month: 2, day: 29 },
    { month: 10, day: 0 },
    { filters: { status: "INVALID" } },
    { filters: { payment: "invalid" } },
    { filters: { context: "invalid" } },
    { filters: { context: "cash", payment: "unpaid" } },
    { filters: { barberId: "" } },
  ])("rejeita parâmetros %j antes do banco", async (extra) => {
    const repository = { getAdminCalendarMetrics: vi.fn() };
    await expect(
      new GetAdminCalendarMetricsUseCase(repository).execute({
        adminRole: "ADMIN",
        year: 2026,
        ...extra,
      } as GetAdminCalendarMetricsRequest),
    ).rejects.toMatchObject({ status: 422 });
    expect(repository.getAdminCalendarMetrics).not.toHaveBeenCalled();
  });
  it("encaminha filtros e aceita profissionais inativos sem modificar a identidade", async () => {
    const repository = {
      getAdminCalendarMetrics: vi.fn().mockResolvedValue({}),
    };
    await new GetAdminCalendarMetricsUseCase(repository).execute({
      adminRole: "ADMIN",
      year: 2024,
      month: 2,
      day: 29,
      filters: { barberId: "inactive", status: "COMPLETED", payment: "unpaid" },
    });
    expect(repository.getAdminCalendarMetrics).toHaveBeenCalledWith(
      2024,
      2,
      29,
      {
        barberId: "inactive",
        status: "COMPLETED",
        payment: "unpaid",
        context: "agenda",
      },
    );
  });
  it("caixa força pagamento confirmado quando não especificado", async () => {
    const repository = {
      getAdminCalendarMetrics: vi.fn().mockResolvedValue({}),
    };
    await new GetAdminCalendarMetricsUseCase(repository).execute({
      adminRole: "ADMIN",
      year: 2026,
      month: 10,
      filters: { context: "cash" },
    });
    expect(repository.getAdminCalendarMetrics).toHaveBeenCalledWith(
      2026,
      10,
      undefined,
      { context: "cash", payment: "paid" },
    );
  });
});
