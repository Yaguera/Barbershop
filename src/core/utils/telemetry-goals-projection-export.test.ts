import { describe, expect, it } from "vitest";
import {
  buildBookingFunnel,
  buildEndOfMonthProjection,
  buildSafeCsvExport,
  evaluateManagementGoals,
  sanitizeCsvCell,
  type TelemetryEventInput,
} from "./telemetry-goals-projection-export";

describe("telemetry-goals-projection-export (Fase P4)", () => {
  it("deduplica jornadas online no funil de 7 dias e separa reservas manuais da recepção (WhatsApp/Presencial)", () => {
    const events: TelemetryEventInput[] = [
      // Jornada 1: Iniciou -> Selecionou (2 renders repetidos) -> Confirmou em 10 minutos
      {
        id: "e1",
        eventName: "booking_started",
        journeyId: "j-1",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: null,
        serviceId: null,
        barberId: null,
        amountCents: null,
        occurredAt: new Date("2026-10-10T14:00:00.000Z"),
      },
      {
        id: "e2a",
        eventName: "booking_details_selected",
        journeyId: "j-1",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: null,
        serviceId: "s1",
        barberId: "b1",
        amountCents: null,
        occurredAt: new Date("2026-10-10T14:02:00.000Z"),
      },
      {
        id: "e2b",
        eventName: "booking_details_selected",
        journeyId: "j-1",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: null,
        serviceId: "s1",
        barberId: "b1",
        amountCents: null,
        occurredAt: new Date("2026-10-10T14:02:05.000Z"),
      },
      {
        id: "e3",
        eventName: "appointment_created",
        journeyId: "j-1",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: "appt-online-1",
        serviceId: "s1",
        barberId: "b1",
        amountCents: 6000,
        occurredAt: new Date("2026-10-10T14:05:00.000Z"),
      },
      // Jornada 2: Iniciou -> Selecionou -> Abandonou antes do login/confirmação
      {
        id: "e4",
        eventName: "booking_started",
        journeyId: "j-2",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: null,
        serviceId: null,
        barberId: null,
        amountCents: null,
        occurredAt: new Date("2026-10-11T10:00:00.000Z"),
      },
      {
        id: "e5",
        eventName: "booking_details_selected",
        journeyId: "j-2",
        channel: "ONLINE",
        actorRole: "CLIENT",
        appointmentId: null,
        serviceId: "s2",
        barberId: "b1",
        amountCents: null,
        occurredAt: new Date("2026-10-11T10:01:00.000Z"),
      },
      // Reserva manual via WhatsApp pela recepção (não deve inflar nem dividir pelas jornadas online!)
      {
        id: "e6",
        eventName: "appointment_created",
        journeyId: null,
        channel: "WHATSAPP",
        actorRole: "RECEPTIONIST",
        appointmentId: "appt-whats-1",
        serviceId: "s1",
        barberId: "b1",
        amountCents: 6000,
        occurredAt: new Date("2026-10-12T11:00:00.000Z"),
      },
    ];

    const funnel = buildBookingFunnel({ events, windowDays: 7 });

    expect(funnel.onlineStartedJourneysCount).toBe(2);
    expect(funnel.onlineDetailsSelectedJourneysCount).toBe(2);
    expect(funnel.onlineConfirmedJourneysCount).toBe(1);
    expect(funnel.onlineSelectionRate).toBe(100);
    expect(funnel.onlineConfirmationRate).toBe(50);
    expect(funnel.whatsappCreatedCount).toBe(1);
    expect(funnel.manualOperationalCreatedCount).toBe(1);
    expect(funnel.totalAppointmentsCreatedInPeriod).toBe(2);
  });

  it("avalia metas opcionais respeitando polaridade e exibe 'Meta não definida' quando ausente", () => {
    const cards = evaluateManagementGoals({
      configuredGoals: [
        {
          metricCode: "RECEIVED_REVENUE_CENTS",
          monthKey: "2026-10",
          barberId: "ALL",
          targetValue: 1000000, // R$ 10.000,00
          unit: "CENTS",
        },
        {
          metricCode: "EXPENSE_CEILING_CENTS",
          monthKey: "2026-10",
          barberId: "ALL",
          targetValue: 300000, // Teto R$ 3.000,00
          unit: "CENTS",
        },
      ],
      actuals: {
        receivedRevenueCents: 1200000, // R$ 12.000,00 (acima da meta -> favorável)
        realizedProductionCents: 1300000,
        barbershopContributionCents: 780000,
        occupancyRatePercent: 72.5,
        recognizedExpensesCents: 250000, // R$ 2.500,00 (abaixo do teto -> favorável)
        noShowRatePercent: 3.1,
      },
    });

    const receivedGoal = cards.find(
      (c) => c.metricCode === "RECEIVED_REVENUE_CENTS"
    )!;
    expect(receivedGoal.hasGoal).toBe(true);
    expect(receivedGoal.favorable).toBe(true);
    expect(receivedGoal.attainmentRate).toBe(120);

    const expenseGoal = cards.find(
      (c) => c.metricCode === "EXPENSE_CEILING_CENTS"
    )!;
    expect(expenseGoal.hasGoal).toBe(true);
    expect(expenseGoal.favorable).toBe(true);
    expect(expenseGoal.statusLabel).toContain("Dentro do teto");

    const unconfiguredGoal = cards.find(
      (c) => c.metricCode === "REALIZED_PRODUCTION_CENTS"
    )!;
    expect(unconfiguredGoal.hasGoal).toBe(false);
    expect(unconfiguredGoal.statusLabel).toBe("Meta não definida");
  });

  it("bloqueia projeção linear de fim de mês com menos de 5 dias observados e separa reservas futuras de receita realizada", () => {
    const earlyMonth = buildEndOfMonthProjection({
      isCurrentMonth: true,
      monthKey: "2026-10",
      observedDays: 3,
      totalDaysInMonth: 31,
      observedRealizedCents: 90000,
      observedReceivedCents: 80000,
      futureScheduledPendingCents: 150000,
      futureScheduledPendingCount: 25,
    });

    expect(earlyMonth.isEligible).toBe(false);
    expect(earlyMonth.ineligibilityReason).toContain("Histórico insuficiente");
    expect(earlyMonth.confirmedPlusObservedFloorCents).toBe(240000);

    const matureMonth = buildEndOfMonthProjection({
      isCurrentMonth: true,
      monthKey: "2026-10",
      observedDays: 10,
      totalDaysInMonth: 31,
      observedRealizedCents: 300000, // R$ 300/dia
      observedReceivedCents: 280000,
      futureScheduledPendingCents: 120000,
      futureScheduledPendingCount: 20,
    });

    expect(matureMonth.isEligible).toBe(true);
    expect(matureMonth.linearProjectedRealizedCents).toBe(930000); // 300 * 31
    expect(matureMonth.futureScheduledPendingCents).toBe(120000);
  });

  it("previne injeção de fórmulas em células CSV mantendo números negativos legítimos", () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe("\"'=CMD|' /C calc'!A0\"");
    expect(sanitizeCsvCell("+SUM(A1:A10)")).toBe("\"'+SUM(A1:A10)\"");
    expect(sanitizeCsvCell("@IMPORTXML()")).toBe("\"'@IMPORTXML()\"");
    expect(sanitizeCsvCell("-150,50")).toBe("\"-150,50\"");

    const csv = buildSafeCsvExport({
      reportTitle: "Resumo Executivo",
      periodLabel: "Outubro 2026",
      filterSignature: "period=month",
      calculatedAt: "2026-10-18T21:00:00-03:00",
      columns: ["Cliente", "Valor"],
      rows: [["=HYPERLINK(\"http://evil\")", 5000]],
    });

    expect(csv).toContain("\"'=HYPERLINK(\"\"http://evil\"\")\";5000");
  });
});
