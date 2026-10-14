import { describe, expect, it } from "vitest";
import {
  calendarDays,
  calendarTime,
  calendarToday,
  calendarUrl,
  parseCalendarState,
  shiftCalendarDate,
  validCalendarDate,
} from "./admin-calendar";
import { vi } from "vitest";
describe("Business calendar navigation", () => {
  it.each([
    ["2026-12-31", "day", 1, "2027-01-01"],
    ["2026-01-01", "day", -1, "2025-12-31"],
    ["2026-01-31", "month", 1, "2026-02-28"],
    ["2024-01-31", "month", 1, "2024-02-29"],
    ["2024-02-29", "year", 1, "2025-02-28"],
    ["2026-12-31", "month", 1, "2027-01-31"],
  ] as const)(
    "avança %s em %s sem pular meses",
    (date, view, offset, expected) => {
      expect(shiftCalendarDate(date, view, offset)).toBe(expected);
    },
  );
  it.each([
    "2026-02-30",
    "2026-13-01",
    "2026-00-01",
    "2026-10-0",
    "2026-10-01T00:00:00Z",
    "1969-12-31",
    "2101-01-01",
  ])("rejeita data inválida %s", (date) => {
    expect(validCalendarDate(date)).toBe(false);
  });
  it("aceita ano bissexto e rejeita 29/02 em ano comum", () => {
    expect(validCalendarDate("2024-02-29")).toBe(true);
    expect(validCalendarDate("2026-02-29")).toBe(false);
  });
  it("monta semanas a partir de segunda, sem dias de meses vizinhos com contagem falsa", () => {
    const days = calendarDays("2026-10-13");
    expect(days.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(days.filter(Boolean)).toHaveLength(31);
    expect(days.length % 7).toBe(0);
    expect(calendarDays("2024-02-01").filter(Boolean)).toHaveLength(29);
  });
  it("preserva visão, data e filtros na URL, incluindo caixa e inativos", () => {
    const state = {
      view: "month" as const,
      date: "2026-10-13",
      barberId: "inactive-barber",
      status: "COMPLETED" as const,
      payment: "paid" as const,
      context: "cash" as const,
    };
    const url = calendarUrl(state);
    expect(
      parseCalendarState(
        new URL(url, "https://example.test").searchParams,
        "2026-10-01",
      ),
    ).toEqual({ state, error: null });
  });
  it("inicia no dia atual e diferencia URL inválida de agenda vazia", () => {
    expect(
      parseCalendarState(new URLSearchParams(), "2026-10-13").state,
    ).toMatchObject({ view: "day", date: "2026-10-13", context: "agenda" });
    for (const query of [
      "view=invalid",
      "date=2026-02-30",
      "status=invalid",
      "context=cash&payment=unpaid",
    ])
      expect(
        parseCalendarState(new URLSearchParams(query), "2026-10-13").error,
      ).toBeTruthy();
  });
  it("usa Brasília perto da meia-noite, independentemente do fuso do dispositivo", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-10-14T01:30:00Z"));
      expect(calendarToday()).toBe("2026-10-13");
      expect(calendarTime("2026-10-14T01:30:00Z")).toBe("22:30");
    } finally {
      vi.useRealTimers();
    }
  });
});
