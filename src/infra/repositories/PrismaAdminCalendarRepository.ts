import type {
  AdminCalendarResult,
  CalendarBucket,
  CalendarFilters,
} from "@/core/domain/repositories/AdminCalendarRepository";
import { NotFoundError } from "@/core/domain/errors";
import { emptyCalendarSummary } from "@/core/utils/admin-calendar";
import { businessDate } from "@/core/utils/report-period";
import { getYYYYMMDD } from "@/core/utils/date-utils";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db/prisma-client";

export class PrismaAdminCalendarRepository {
  async getMetrics(
    year: number,
    month?: number,
    day?: number,
    filters: CalendarFilters = {},
  ): Promise<AdminCalendarResult> {
    const context = filters.context || "agenda";
    const start = businessDate(year, month ? month - 1 : 0, day || 1);
    const next = day
      ? businessDate(year, month! - 1, day + 1)
      : month
        ? businessDate(year, month, 1)
        : businessDate(year + 1, 0, 1);
    const end = new Date(next.getTime() - 1);
    const cash = context === "cash";
    const dates = { gte: start, lte: end };
    const where: Prisma.AppointmentWhereInput = {
      barberId:
        filters.barberId && filters.barberId !== "all"
          ? filters.barberId
          : undefined,
      status:
        filters.status && filters.status !== "all" ? filters.status : undefined,
      ...(cash
        ? { receipt: { is: { status: "CONFIRMED", confirmedAt: dates } } }
        : {
            startTime: dates,
            ...(filters.payment === "paid"
              ? { receipt: { is: { status: "CONFIRMED" } } }
              : filters.payment === "unpaid"
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
        if (
          where.barberId &&
          !(await tx.barber.findUnique({
            where: { id: where.barberId as string },
            select: { id: true },
          }))
        )
          throw new NotFoundError("Profissional não encontrado.");
        const dateColumn = cash
          ? Prisma.sql`r."confirmedAt"`
          : Prisma.sql`a."startTime"`;
        const format = month ? "YYYY-MM-DD" : "YYYY-MM";
        const barber =
          typeof where.barberId === "string"
            ? Prisma.sql`AND a."barberId" = ${where.barberId}`
            : Prisma.empty;
        const status = where.status
          ? Prisma.sql`AND a.status = ${filters.status}`
          : Prisma.empty;
        const payment = cash
          ? Prisma.sql`AND r.status = 'CONFIRMED'`
          : filters.payment === "paid"
            ? Prisma.sql`AND r.status = 'CONFIRMED'`
            : filters.payment === "unpaid"
              ? Prisma.sql`AND (r.id IS NULL OR r.status <> 'CONFIRMED')`
              : Prisma.empty;
        const rows = await tx.$queryRaw<CalendarBucket[]>(Prisma.sql`
        SELECT TO_CHAR(${dateColumn} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', ${format}) AS date,
          COUNT(*)::int AS count,
          COUNT(*) FILTER (WHERE a.status = 'PENDING')::int AS pending,
          COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS completed,
          COUNT(*) FILTER (WHERE a.status = 'CANCELED')::int AS canceled,
          COUNT(*) FILTER (WHERE a.status = 'NO_SHOW')::int AS "noShow",
          COALESCE(SUM(a."priceCents") FILTER (WHERE a.status = 'COMPLETED'), 0)::float8 AS "realizedCents",
          COALESCE(SUM(r."amountCents") FILTER (WHERE r.status = 'CONFIRMED'), 0)::float8 AS "receivedCents",
          COALESCE(SUM(a."priceCents") FILTER (WHERE a.status = 'COMPLETED' AND (r.id IS NULL OR r.status <> 'CONFIRMED')), 0)::float8 AS "unpaidCents",
          COALESCE(SUM(EXTRACT(EPOCH FROM (a."endTime" - a."startTime")) / 60) FILTER (WHERE a.status IN ('PENDING', 'COMPLETED')), 0)::float8 AS "reservedMinutes"
        FROM "Appointment" a LEFT JOIN "PaymentReceipt" r ON r."appointmentId" = a.id
        WHERE ${dateColumn} >= ${start} AND ${dateColumn} <= ${end} ${barber} ${status} ${payment}
        GROUP BY date ORDER BY date
      `);
        const summary = emptyCalendarSummary();
        for (const row of rows)
          for (const key of Object.keys(summary) as (keyof typeof summary)[])
            summary[key] += row[key];
        const appointments = day
          ? await tx.appointment.findMany({
              where,
              orderBy: cash
                ? [{ receipt: { confirmedAt: "asc" } }, { id: "asc" }]
                : [{ startTime: "asc" }, { id: "asc" }],
              select: {
                id: true,
                startTime: true,
                endTime: true,
                status: true,
                origin: true,
                priceCents: true,
                commissionCents: true,
                barberId: true,
                client: { select: { name: true } },
                clientContact: { select: { name: true } },
                service: { select: { name: true } },
                barber: {
                  select: { user: { select: { name: true, active: true } } },
                },
                receipt: {
                  select: {
                    status: true,
                    confirmedAt: true,
                    amountCents: true,
                    method: true,
                  },
                },
              },
            })
          : [];
        return {
          buckets: rows,
          summary,
          startDate: getYYYYMMDD(start),
          endDate: getYYYYMMDD(end),
          context,
          appointments: appointments.map((a) => ({
            id: a.id,
            startTime: a.startTime.toISOString(),
            endTime: a.endTime.toISOString(),
            status: a.status,
            origin: a.origin,
            priceCents: a.priceCents,
            commissionCents: a.commissionCents,
            barberId: a.barberId,
            barberName: a.barber.user.name || "Barbeiro",
            barberActive: a.barber.user.active,
            clientName: a.client?.name || a.clientContact?.name || "Cliente",
            clientType: a.client
              ? ("REGISTERED" as const)
              : ("CONTACT" as const),
            serviceName: a.service.name,
            paymentStatus:
              a.receipt?.status === "CONFIRMED"
                ? ("CONFIRMED" as const)
                : a.receipt?.status === "REVERSED"
                  ? ("REVERSED" as const)
                  : ("UNCONFIRMED" as const),
            confirmedAt:
              a.receipt?.status === "CONFIRMED"
                ? a.receipt.confirmedAt.toISOString()
                : null,
            receivedCents:
              a.receipt?.status === "CONFIRMED" ? a.receipt.amountCents : 0,
            paymentMethod:
              a.receipt?.status === "CONFIRMED" ? a.receipt.method : null,
          })),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
