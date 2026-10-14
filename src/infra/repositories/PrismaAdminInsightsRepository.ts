import type {
  AdminInsightsRepository,
  InsightRange,
  InsightDetailFilter,
  ProductionGroup,
  ReceiptGroup,
} from "@/core/domain/repositories/AdminInsightsRepository";
import { buildAdminInsights } from "@/core/utils/admin-insights";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db/prisma-client";

export class PrismaAdminInsightsRepository implements AdminInsightsRepository {
  async overview(range: InsightRange) {
    return prisma.$transaction(
      async (tx) => {
        const barber = range.barberId
          ? Prisma.sql`AND a."barberId" = ${range.barberId}`
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
        WHERE a.status = 'COMPLETED' AND a."startTime" >= ${range.startDate} AND a."startTime" <= ${range.endDate} ${barber}
        GROUP BY day, a."barberId", bu.name, a."serviceId", s.name, a."clientId", a."clientContactId", c.name, cc.name
      `);
        const receipts = await tx.$queryRaw<ReceiptGroup[]>(Prisma.sql`
        SELECT TO_CHAR(r."confirmedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
          a."barberId", COALESCE(u.name, 'Barbeiro') AS "barberName", SUM(r."amountCents")::float8 AS "amountCents"
        FROM "PaymentReceipt" r JOIN "Appointment" a ON a.id = r."appointmentId"
        JOIN "Barber" b ON b.id = a."barberId" JOIN "User" u ON u.id = b."userId"
        WHERE r.status = 'CONFIRMED' AND r."confirmedAt" >= ${range.startDate} AND r."confirmedAt" <= ${range.endDate} ${barber}
        GROUP BY day, a."barberId", u.name
      `);
        const statuses = await tx.appointment.groupBy({
          by: ["status"],
          where: {
            barberId: range.barberId,
            startTime: { gte: range.startDate, lte: range.endDate },
            status: { in: ["CANCELED", "NO_SHOW"] },
          },
          _count: true,
        });
        return buildAdminInsights(
          range,
          production,
          receipts,
          statuses.find((s) => s.status === "CANCELED")?._count || 0,
          statuses.find((s) => s.status === "NO_SHOW")?._count || 0,
        );
      },
      { isolationLevel: "RepeatableRead" },
    );
  }

  async details(range: InsightRange, filter: InsightDetailFilter) {
    const received = filter.kind === "received";
    const dates = { gte: range.startDate, lte: range.endDate };
    const where: Prisma.AppointmentWhereInput = {
      barberId: range.barberId,
      serviceId: filter.serviceId,
      ...(filter.clientType === "REGISTERED"
        ? { clientId: filter.clientId }
        : filter.clientType === "CONTACT"
          ? { clientContactId: filter.clientId }
          : {}),
      ...(received
        ? { receipt: { is: { status: "CONFIRMED", confirmedAt: dates } } }
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
            priceCents: true,
            commissionCents: true,
            client: { select: { name: true } },
            clientContact: { select: { name: true } },
            barber: { select: { user: { select: { name: true } } } },
            service: { select: { name: true } },
            receipt: {
              select: { status: true, confirmedAt: true, amountCents: true },
            },
          },
        });
        const sum = received
          ? (
              await tx.paymentReceipt.aggregate({
                where: { appointment: where },
                _sum: { amountCents: true },
              })
            )._sum.amountCents
          : (
              await tx.appointment.aggregate({
                where,
                _sum: { priceCents: true },
              })
            )._sum.priceCents;
        return {
          total,
          page,
          pageSize,
          amountCents: sum || 0,
          rows: rows.map((a) => ({
            id: a.id,
            startTime: a.startTime.toISOString(),
            endTime: a.endTime.toISOString(),
            status: a.status,
            clientName: a.client?.name || a.clientContact?.name || "Cliente",
            barberName: a.barber.user.name || "Barbeiro",
            serviceName: a.service.name,
            paid: a.receipt?.status === "CONFIRMED",
            confirmedAt:
              a.receipt?.status === "CONFIRMED"
                ? a.receipt.confirmedAt.toISOString()
                : null,
            priceCents: a.priceCents,
            commissionCents: a.commissionCents,
            amountCents: received ? a.receipt!.amountCents : a.priceCents,
          })),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
