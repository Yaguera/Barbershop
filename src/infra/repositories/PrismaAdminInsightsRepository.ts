import type {
  AdminInsights,
  AdminInsightsRepository,
  InsightDetailFilter,
  InsightRange,
  ProductionGroup,
  ReceiptGroup,
} from "@/core/domain/repositories/AdminInsightsRepository";
import {
  buildAdminInsights,
  buildInsightComparison,
} from "@/core/utils/admin-insights";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db/prisma-client";

export class PrismaAdminInsightsRepository implements AdminInsightsRepository {
  private resolveBarberIds(
    barberId?: string,
    barberIds?: string[],
  ): string[] {
    if (barberIds && barberIds.length > 0) {
      return barberIds.filter((id) => id && id !== "all");
    }
    if (barberId && barberId !== "all") {
      return [barberId];
    }
    return [];
  }

  private resolveServiceIds(
    serviceId?: string,
    serviceIds?: string[],
  ): string[] {
    if (serviceIds && serviceIds.length > 0) {
      return serviceIds.filter((id) => id && id !== "all");
    }
    if (serviceId && serviceId !== "all") {
      return [serviceId];
    }
    return [];
  }

  private async queryRangeSnapshot(
    tx: Prisma.TransactionClient,
    range: InsightRange,
    startDate: Date,
    endDate: Date,
  ): Promise<AdminInsights> {
    const barberIds = this.resolveBarberIds(range.barberId, range.barberIds);
    const serviceIds = this.resolveServiceIds(undefined, range.serviceIds);
    const origins = range.origins?.filter(Boolean) ?? [];
    const paymentMethods = range.paymentMethods?.filter(Boolean) ?? [];

    const barberClause =
      barberIds.length > 0
        ? Prisma.sql`AND a."barberId" IN (${Prisma.join(barberIds)})`
        : Prisma.empty;
    const serviceClause =
      serviceIds.length > 0
        ? Prisma.sql`AND a."serviceId" IN (${Prisma.join(serviceIds)})`
        : Prisma.empty;
    const originClause =
      origins.length > 0
        ? Prisma.sql`AND a."origin" IN (${Prisma.join(origins)})`
        : Prisma.empty;
    // Rule 6.2: Payment method filter restricts cash receipts only; it does not alter production as if unpaid services had a known payment method.
    const paymentMethodClause =
      paymentMethods.length > 0
        ? Prisma.sql`AND r."method" IN (${Prisma.join(paymentMethods)})`
        : Prisma.empty;

    const production = await tx.$queryRaw<ProductionGroup[]>(Prisma.sql`
      SELECT TO_CHAR(a."startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
        a."barberId", COALESCE(bu.name, 'Barbeiro') AS "barberName", a."serviceId", s.name AS "serviceName",
        CASE WHEN a."clientId" IS NOT NULL THEN 'REGISTERED:' || a."clientId" ELSE 'CONTACT:' || a."clientContactId" END AS "clientKey",
        COALESCE(c.name, cc.name, 'Cliente') AS "clientName",
        CASE WHEN a."clientId" IS NOT NULL THEN 'REGISTERED' ELSE 'CONTACT' END AS "clientType",
        COUNT(*)::int AS count, SUM(a."priceCents")::float8 AS "amountCents",
        SUM(a."commissionCents")::float8 AS "commissionCents",
        SUM(CASE WHEN r.status = 'CONFIRMED' THEN 0 ELSE a."priceCents" END)::float8 AS "pendingCents"
      FROM "Appointment" a JOIN "Barber" b ON b.id = a."barberId" JOIN "User" bu ON bu.id = b."userId"
      JOIN "Service" s ON s.id = a."serviceId" LEFT JOIN "User" c ON c.id = a."clientId"
      LEFT JOIN "ClientContact" cc ON cc.id = a."clientContactId" LEFT JOIN "PaymentReceipt" r ON r."appointmentId" = a.id
      WHERE a.status = 'COMPLETED'
        AND a."startTime" >= ${startDate}
        AND a."startTime" <= ${endDate}
        ${barberClause}
        ${serviceClause}
        ${originClause}
      GROUP BY day, a."barberId", bu.name, a."serviceId", s.name, a."clientId", a."clientContactId", c.name, cc.name
    `);

    const receipts = await tx.$queryRaw<ReceiptGroup[]>(Prisma.sql`
      SELECT TO_CHAR(r."confirmedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
        a."barberId", COALESCE(u.name, 'Barbeiro') AS "barberName",
        r."method" AS "method",
        COUNT(*)::int AS count,
        SUM(r."amountCents")::float8 AS "amountCents"
      FROM "PaymentReceipt" r JOIN "Appointment" a ON a.id = r."appointmentId"
      JOIN "Barber" b ON b.id = a."barberId" JOIN "User" u ON u.id = b."userId"
      WHERE r.status = 'CONFIRMED'
        AND r."confirmedAt" >= ${startDate}
        AND r."confirmedAt" <= ${endDate}
        ${barberClause}
        ${serviceClause}
        ${originClause}
        ${paymentMethodClause}
      GROUP BY day, a."barberId", u.name, r."method"
    `);

    const statuses = await tx.appointment.groupBy({
      by: ["status"],
      where: {
        ...(barberIds.length > 0 ? { barberId: { in: barberIds } } : {}),
        ...(serviceIds.length > 0 ? { serviceId: { in: serviceIds } } : {}),
        ...(origins.length > 0 ? { origin: { in: origins } } : {}),
        startTime: { gte: startDate, lte: endDate },
        status: { in: ["CANCELED", "NO_SHOW"] },
      },
      _count: true,
    });

    return buildAdminInsights(
      { ...range, startDate, endDate, barberIds },
      production,
      receipts,
      statuses.find((s) => s.status === "CANCELED")?._count || 0,
      statuses.find((s) => s.status === "NO_SHOW")?._count || 0,
    );
  }

  async overview(range: InsightRange) {
    return prisma.$transaction(
      async (tx) => {
        const current = await this.queryRangeSnapshot(
          tx,
          range,
          range.startDate,
          range.endDate,
        );

        if (
          range.compareMode &&
          range.compareMode !== "none" &&
          range.compareStartDate &&
          range.compareEndDate
        ) {
          const reference = await this.queryRangeSnapshot(
            tx,
            range,
            range.compareStartDate,
            range.compareEndDate,
          );
          current.comparison = buildInsightComparison(
            range.compareMode,
            current,
            reference,
            range.comparisonNote,
          );
        } else {
          current.comparison = null;
        }

        return current;
      },
      { isolationLevel: "RepeatableRead" },
    );
  }

  async details(range: InsightRange, filter: InsightDetailFilter) {
    const received = filter.kind === "received";
    const dates = { gte: range.startDate, lte: range.endDate };
    const barberIds = this.resolveBarberIds(
      filter.barberId ?? range.barberId,
      filter.barberIds ?? range.barberIds,
    );
    const serviceIds = this.resolveServiceIds(
      filter.serviceId,
      filter.serviceIds ?? range.serviceIds,
    );
    const origins = (filter.origins ?? range.origins)?.filter(Boolean) ?? [];
    const paymentMethods =
      (filter.paymentMethods ?? range.paymentMethods)?.filter(Boolean) ?? [];

    const where: Prisma.AppointmentWhereInput = {
      barberId:
        barberIds.length === 1
          ? barberIds[0]
          : barberIds.length > 1
            ? { in: barberIds }
            : undefined,
      serviceId:
        serviceIds.length === 1
          ? serviceIds[0]
          : serviceIds.length > 1
            ? { in: serviceIds }
            : undefined,
      ...(origins.length > 0 ? { origin: { in: origins } } : {}),
      ...(filter.clientType === "REGISTERED"
        ? { clientId: filter.clientId }
        : filter.clientType === "CONTACT"
          ? { clientContactId: filter.clientId }
          : {}),
      ...(received
        ? {
            receipt: {
              is: {
                status: "CONFIRMED",
                confirmedAt: dates,
                ...(paymentMethods.length > 0
                  ? { method: { in: paymentMethods } }
                  : {}),
              },
            },
          }
        : {
            startTime: dates,
            status:
              filter.kind === "canceled"
                ? "CANCELED"
                : filter.kind === "no_show"
                  ? "NO_SHOW"
                  : "COMPLETED",
            ...(filter.kind === "pending"
              ? {
                  OR: [
                    { receipt: { is: null } },
                    { receipt: { is: { status: { not: "CONFIRMED" } } } },
                  ],
                }
              : {}),
          }),
    };

    return prisma.$transaction(
      async (tx) => {
        const total = await tx.appointment.count({ where });
        const pageSize = 30;
        const page = Math.min(
          filter.page || 1,
          Math.max(1, Math.ceil(total / pageSize)),
        );
        const rows = await tx.appointment.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: received
            ? [{ receipt: { confirmedAt: "desc" } }, { id: "asc" }]
            : [{ startTime: "desc" }, { id: "asc" }],
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            origin: true,
            barberId: true,
            serviceId: true,
            priceCents: true,
            commissionCents: true,
            client: { select: { name: true } },
            clientContact: { select: { name: true } },
            barber: { select: { user: { select: { name: true } } } },
            service: { select: { name: true } },
            receipt: {
              select: {
                status: true,
                method: true,
                confirmedAt: true,
                amountCents: true,
              },
            },
          },
        });
        const apptAgg = await tx.appointment.aggregate({
          where,
          _sum: { priceCents: true, commissionCents: true },
        });
        const sumPrice = apptAgg._sum.priceCents || 0;
        const sumCommission = apptAgg._sum.commissionCents || 0;
        const sumContribution = sumPrice - sumCommission;
        const sum = received
          ? (
              await tx.paymentReceipt.aggregate({
                where: { appointment: where },
                _sum: { amountCents: true },
              })
            )._sum.amountCents || 0
          : sumPrice;

        return {
          total,
          page,
          pageSize,
          amountCents: sum,
          priceCents: sumPrice,
          commissionCents: sumCommission,
          contributionCents: sumContribution,
          calculatedAt: new Date().toISOString(),
          rows: rows.map((a) => ({
            id: a.id,
            startTime: a.startTime.toISOString(),
            endTime: a.endTime.toISOString(),
            status: a.status,
            origin: a.origin,
            barberId: a.barberId,
            serviceId: a.serviceId,
            clientName: a.client?.name || a.clientContact?.name || "Cliente",
            barberName: a.barber.user.name || "Barbeiro",
            serviceName: a.service.name,
            paid: a.receipt?.status === "CONFIRMED",
            paymentMethod:
              a.receipt?.status === "CONFIRMED" ? a.receipt.method : null,
            confirmedAt:
              a.receipt?.status === "CONFIRMED"
                ? a.receipt.confirmedAt.toISOString()
                : null,
            priceCents: a.priceCents,
            commissionCents: a.commissionCents,
            contributionCents: a.priceCents - a.commissionCents,
            amountCents: received ? a.receipt!.amountCents : a.priceCents,
          })),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}

