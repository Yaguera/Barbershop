import { toBusinessLocalParts } from "@/core/utils/operations-retention-capacity";
import { daysInCalendarMonth } from "@/core/utils/report-period";
import {
  buildBookingFunnel,
  buildEndOfMonthProjection,
  buildSafeCsvExport,
  evaluateManagementGoals,
  GOAL_METRIC_DEFINITIONS,
  type DigitalFunnelSummary,
  type EndOfMonthProjectionSummary,
  type EvaluatedGoalCard,
  type GoalMetricCode,
  type ManagementGoalInput,
  type TelemetryEventInput,
  type TelemetryEventName,
} from "@/core/utils/telemetry-goals-projection-export";
import { prisma } from "../db/prisma-client";

export interface PhaseP4WorkspaceData {
  monthKey: string;
  funnel: DigitalFunnelSummary;
  goals: EvaluatedGoalCard[];
  projection: EndOfMonthProjectionSummary;
  recentEvents: TelemetryEventInput[];
}

let p4TablesInitialized = false;

export class PrismaTelemetryGoalsRepository {
  async ensurePhaseP4TablesExist(): Promise<void> {
    if (p4TablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InternalTelemetryEvent" (
          "id" TEXT NOT NULL,
          "eventName" TEXT NOT NULL,
          "schemaVersion" INTEGER NOT NULL DEFAULT 1,
          "journeyId" TEXT,
          "channel" TEXT,
          "actorRole" TEXT,
          "appointmentId" TEXT,
          "serviceId" TEXT,
          "barberId" TEXT,
          "amountCents" INTEGER,
          "metadataJson" TEXT,
          "idempotencyKey" TEXT,
          "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "InternalTelemetryEvent_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "InternalTelemetryEvent_idempotencyKey_key" ON "InternalTelemetryEvent"("idempotencyKey");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ManagementGoal" (
          "id" TEXT NOT NULL,
          "metricCode" TEXT NOT NULL,
          "monthKey" TEXT NOT NULL,
          "barberId" TEXT NOT NULL DEFAULT 'ALL',
          "targetValue" INTEGER NOT NULL,
          "unit" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ManagementGoal_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "ManagementGoal_metricCode_monthKey_barberId_key" ON "ManagementGoal"("metricCode", "monthKey", "barberId");
      `);
      p4TablesInitialized = true;
    } catch (err) {
      console.warn(
        "[PrismaTelemetryGoalsRepository] Warning ensuring P4 tables:",
        err
      );
    }
  }

  async recordTelemetryEvent(params: {
    eventName: TelemetryEventName;
    journeyId?: string | null;
    channel?: string | null;
    actorRole?: string | null;
    appointmentId?: string | null;
    serviceId?: string | null;
    barberId?: string | null;
    amountCents?: number | null;
    metadataJson?: string | null;
    idempotencyKey?: string | null;
  }) {
    await this.ensurePhaseP4TablesExist();

    try {
      if (params.idempotencyKey) {
        return await prisma.internalTelemetryEvent.upsert({
          where: { idempotencyKey: params.idempotencyKey },
          create: {
            eventName: params.eventName,
            journeyId: params.journeyId || null,
            channel: params.channel || "ONLINE",
            actorRole: params.actorRole || null,
            appointmentId: params.appointmentId || null,
            serviceId: params.serviceId || null,
            barberId: params.barberId || null,
            amountCents: params.amountCents ?? null,
            metadataJson: params.metadataJson || null,
            idempotencyKey: params.idempotencyKey,
          },
          update: {},
        });
      }

      return await prisma.internalTelemetryEvent.create({
        data: {
          eventName: params.eventName,
          journeyId: params.journeyId || null,
          channel: params.channel || "ONLINE",
          actorRole: params.actorRole || null,
          appointmentId: params.appointmentId || null,
          serviceId: params.serviceId || null,
          barberId: params.barberId || null,
          amountCents: params.amountCents ?? null,
          metadataJson: params.metadataJson || null,
        },
      });
    } catch (err) {
      console.warn(
        "[PrismaTelemetryGoalsRepository] Non-blocking telemetry error:",
        err
      );
      return null;
    }
  }

  async upsertManagementGoal(params: {
    metricCode: GoalMetricCode;
    monthKey: string;
    barberId?: string;
    targetValue: number;
    actorId: string;
  }) {
    await this.ensurePhaseP4TablesExist();

    const def = GOAL_METRIC_DEFINITIONS[params.metricCode];
    const barberKey =
      params.barberId && params.barberId !== "all" ? params.barberId : "ALL";

    return prisma.managementGoal.upsert({
      where: {
        metricCode_monthKey_barberId: {
          metricCode: params.metricCode,
          monthKey: params.monthKey,
          barberId: barberKey,
        },
      },
      create: {
        metricCode: params.metricCode,
        monthKey: params.monthKey,
        barberId: barberKey,
        targetValue: Math.round(params.targetValue),
        unit: def.unit,
        createdById: params.actorId,
      },
      update: {
        targetValue: Math.round(params.targetValue),
        unit: def.unit,
        createdById: params.actorId,
      },
    });
  }

  async deleteManagementGoal(params: {
    metricCode: GoalMetricCode;
    monthKey: string;
    barberId?: string;
  }) {
    await this.ensurePhaseP4TablesExist();
    const barberKey =
      params.barberId && params.barberId !== "all" ? params.barberId : "ALL";

    return prisma.managementGoal.deleteMany({
      where: {
        metricCode: params.metricCode,
        monthKey: params.monthKey,
        barberId: barberKey,
      },
    });
  }

  async getPhaseP4WorkspaceData(params: {
    rangeStart: Date;
    rangeEnd: Date;
    period: string;
    barberId?: string;
    barberIds?: string[];
    actuals: {
      receivedRevenueCents: number;
      realizedProductionCents: number;
      barbershopContributionCents: number;
      occupancyRatePercent: number | null;
      noShowRatePercent: number | null;
    };
  }): Promise<PhaseP4WorkspaceData> {
    await this.ensurePhaseP4TablesExist();

    const { rangeStart, rangeEnd, period, barberId, barberIds, actuals } =
      params;

    const now = new Date();
    const nowParts = toBusinessLocalParts(now);
    const rangeStartParts = toBusinessLocalParts(rangeStart);
    const monthKey = rangeStartParts.monthKey;

    const effectiveBarberIds =
      barberIds && barberIds.length > 0
        ? barberIds.filter((id) => id && id !== "all")
        : barberId && barberId !== "all"
          ? [barberId]
          : [];

    const goalBarberKey =
      effectiveBarberIds.length === 1 ? effectiveBarberIds[0] : "ALL";

    const apptBarberWhere =
      effectiveBarberIds.length > 0
        ? { barberId: { in: effectiveBarberIds } }
        : {};

    const [
      telemetryRows,
      createdApptsInPeriod,
      configuredGoalsRows,
      futurePendingAppts,
      expenseAgg,
    ] = await Promise.all([
      prisma.internalTelemetryEvent.findMany({
        where: {
          occurredAt: { gte: rangeStart, lte: rangeEnd },
        },
        orderBy: { occurredAt: "desc" },
        take: 300,
      }),
      prisma.appointment.findMany({
        where: {
          ...apptBarberWhere,
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          id: true,
          origin: true,
          createdAt: true,
        },
      }),
      prisma.managementGoal.findMany({
        where: {
          monthKey,
          barberId: goalBarberKey,
        },
      }),
      prisma.appointment.findMany({
        where: {
          ...apptBarberWhere,
          status: "PENDING",
          startTime: { gt: now, lte: rangeEnd },
        },
        select: {
          priceCents: true,
        },
      }),
      prisma.expense
        .aggregate({
          where: {
            status: { not: "CANCELED" },
            competenceDate: { gte: rangeStart, lte: rangeEnd },
          },
          _sum: { amountCents: true },
        })
        .catch(() => ({ _sum: { amountCents: 0 } })),
    ]);

    const events: TelemetryEventInput[] = telemetryRows.map((r) => ({
      id: r.id,
      eventName: r.eventName as TelemetryEventName,
      journeyId: r.journeyId,
      channel: r.channel,
      actorRole: r.actorRole,
      appointmentId: r.appointmentId,
      serviceId: r.serviceId,
      barberId: r.barberId,
      amountCents: r.amountCents,
      occurredAt: r.occurredAt,
    }));

    const funnel = buildBookingFunnel({
      events,
      periodCreatedAppointments: createdApptsInPeriod,
      windowDays: 7,
    });

    const configuredGoals: ManagementGoalInput[] = configuredGoalsRows.map(
      (g) => ({
        id: g.id,
        metricCode: g.metricCode as GoalMetricCode,
        monthKey: g.monthKey,
        barberId: g.barberId,
        targetValue: g.targetValue,
        unit: g.unit === "PERCENT_TENTHS" ? "PERCENT_TENTHS" : "CENTS",
      })
    );

    const recognizedExpensesCents = expenseAgg._sum.amountCents ?? 0;

    const goals = evaluateManagementGoals({
      configuredGoals,
      actuals: {
        receivedRevenueCents: actuals.receivedRevenueCents,
        realizedProductionCents: actuals.realizedProductionCents,
        barbershopContributionCents: actuals.barbershopContributionCents,
        occupancyRatePercent: actuals.occupancyRatePercent,
        recognizedExpensesCents,
        noShowRatePercent: actuals.noShowRatePercent,
      },
    });

    const isCurrentMonth =
      period === "month" && monthKey === nowParts.monthKey;
    const totalDaysInMonth = daysInCalendarMonth(
      rangeStartParts.year,
      rangeStartParts.month - 1
    );
    const observedDays = isCurrentMonth
      ? Math.min(totalDaysInMonth, Math.max(1, nowParts.day))
      : totalDaysInMonth;

    const futureScheduledPendingCents = futurePendingAppts.reduce(
      (acc, a) => acc + (a.priceCents || 0),
      0
    );

    const projection = buildEndOfMonthProjection({
      isCurrentMonth,
      monthKey,
      observedDays,
      totalDaysInMonth,
      observedRealizedCents: actuals.realizedProductionCents,
      observedReceivedCents: actuals.receivedRevenueCents,
      futureScheduledPendingCents,
      futureScheduledPendingCount: futurePendingAppts.length,
    });

    return {
      monthKey,
      funnel,
      goals,
      projection,
      recentEvents: events.slice(0, 20),
    };
  }

  async exportAnalyticalCsv(params: {
    rangeStart: Date;
    rangeEnd: Date;
    periodLabel: string;
    filterSignature: string;
    barberIds?: string[];
    serviceIds?: string[];
    origins?: string[];
    actorRole: string;
  }): Promise<{ filename: string; csvContent: string; rowCount: number }> {
    await this.ensurePhaseP4TablesExist();

    const apptWhere = {
      startTime: { gte: params.rangeStart, lte: params.rangeEnd },
      ...(params.barberIds && params.barberIds.length > 0
        ? { barberId: { in: params.barberIds } }
        : {}),
      ...(params.serviceIds && params.serviceIds.length > 0
        ? { serviceId: { in: params.serviceIds } }
        : {}),
      ...(params.origins && params.origins.length > 0
        ? { origin: { in: params.origins } }
        : {}),
    };

    const rows = await prisma.appointment.findMany({
      where: apptWhere,
      include: {
        barber: { include: { user: { select: { name: true } } } },
        service: { select: { name: true } },
        client: { select: { name: true } },
        clientContact: { select: { name: true } },
        receipt: true,
      },
      orderBy: [{ startTime: "desc" }, { id: "asc" }],
      take: 2000,
    });

    const columns = [
      "ID Atendimento",
      "Data/Hora (BRT)",
      "Status",
      "Origem",
      "Profissional",
      "Serviço",
      "Cliente",
      "Preço Snapshot (R$)",
      "Comissão Snapshot (R$)",
      "Contribuição Barbearia (R$)",
      "Status Caixa",
      "Meio Pagamento",
      "Data Confirmação Caixa",
    ];

    const dataRows = rows.map((r) => {
      const brtDate = r.startTime.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      const priceReais = ((r.priceCents || 0) / 100).toFixed(2).replace(".", ",");
      const commReais = ((r.commissionCents || 0) / 100)
        .toFixed(2)
        .replace(".", ",");
      const contribReais = (
        ((r.priceCents || 0) - (r.commissionCents || 0)) /
        100
      )
        .toFixed(2)
        .replace(".", ",");
      const receiptStatus = r.receipt ? r.receipt.status : "SEM_RECEBIMENTO";
      const receiptMethod = r.receipt?.method || "—";
      const confirmedAtBrt = r.receipt?.confirmedAt
        ? r.receipt.confirmedAt.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        : "—";

      return [
        r.id,
        brtDate,
        r.status,
        r.origin,
        r.barber?.user?.name || "Barbeiro",
        r.service?.name || "Serviço",
        r.client?.name || r.clientContact?.name || "Cliente",
        priceReais,
        commReais,
        contribReais,
        receiptStatus,
        receiptMethod,
        confirmedAtBrt,
      ];
    });

    const calculatedAt = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const csvContent = buildSafeCsvExport({
      reportTitle: "Relatório Analítico e Financeiro de Atendimentos (Fase P4)",
      periodLabel: params.periodLabel,
      filterSignature: params.filterSignature,
      calculatedAt,
      schemaVersion: "v1.0-P4",
      coverageWarnings: [
        "Preços e comissões refletem os snapshots históricos imutáveis gravados no agendamento.",
      ],
      columns,
      rows: dataRows,
    });

    await this.recordTelemetryEvent({
      eventName: "report_exported",
      channel: "ONLINE",
      actorRole: params.actorRole,
      metadataJson: JSON.stringify({
        filterSignature: params.filterSignature,
        rowCount: dataRows.length,
        format: "CSV",
      }),
    });

    const dateStamp = toBusinessLocalParts(new Date()).dayKey;
    return {
      filename: `barberapp-relatorio-${dateStamp}.csv`,
      csvContent,
      rowCount: dataRows.length,
    };
  }
}
