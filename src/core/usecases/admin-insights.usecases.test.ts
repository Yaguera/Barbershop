import { describe, expect, it, vi } from "vitest";
import { GetAdminInsightsUseCase } from "./GetAdminInsightsUseCase";
import type {
  AdminInsightsRepository,
  InsightDetailFilter,
} from "../domain/repositories/AdminInsightsRepository";
import { startOfDay, endOfDay } from "../utils/date-utils";
const repository = () =>
  ({ overview: vi.fn(), details: vi.fn() }) satisfies AdminInsightsRepository;
describe("Authorization and detail filters", () => {
  it.each(["CLIENT", "BARBER", "RECEPTIONIST"])(
    "nega %s antes de consultar dados",
    (role) => {
      const repo = repository();
      const usecase = new GetAdminInsightsUseCase(repo);
      expect(() => usecase.overview(role, "month")).toThrow();
      expect(() =>
        usecase.details(role, { period: "month", kind: "completed" }),
      ).toThrow();
      expect(repo.overview).not.toHaveBeenCalled();
      expect(repo.details).not.toHaveBeenCalled();
    },
  );
  it("mantém filtros e datas exatas do ponto selecionado em Brasília", () => {
    const repo = repository();
    const filter: InsightDetailFilter = {
      period: "all",
      kind: "received",
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      barberId: "b1",
      serviceId: "s1",
      page: 2,
    };
    new GetAdminInsightsUseCase(repo).details("ADMIN", filter);
    expect(repo.details).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: startOfDay("2026-10-05"),
        endDate: endOfDay("2026-10-05"),
        barberId: "b1",
      }),
      filter,
    );
  });
  it.each([
    { startDate: "2026-02-30", endDate: "2026-03-01" },
    { startDate: "2026-10-01" },
    { startDate: "2026-10-03", endDate: "2026-10-01" },
    { clientId: "x" },
    { page: -1 },
    { page: 1.5 },
    { kind: "invalid" },
    { startDate: "1900-01-01", endDate: "1900-01-01" },
  ])("rejeita filtros inválidos %j", (extra) => {
    const repo = repository();
    expect(() =>
      new GetAdminInsightsUseCase(repo).details("ADMIN", {
        period: "month",
        kind: "completed",
        ...extra,
      } as InsightDetailFilter),
    ).toThrow();
    expect(repo.details).not.toHaveBeenCalled();
  });
});
