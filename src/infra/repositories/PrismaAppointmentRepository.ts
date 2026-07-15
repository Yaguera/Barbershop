import { AppointmentRepository, AppointmentWithRelations, BarberCommission, FinanceReport, BarberPerformanceReport, CalendarMetric, DayAppointmentDetail, AdminCalendarDayResult } from '@/core/domain/repositories/AppointmentRepository';
import { Appointment, Prisma } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';
import { startOfDay, endOfDay } from '@/core/utils/date-utils';

export class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    return await prisma.appointment.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null> {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
      },
    }) as AppointmentWithRelations | null;
  }

  async findByBarberAndDate(barberId: string, startOfDay: Date, endOfDay: Date): Promise<Appointment[]> {
    return await prisma.appointment.findMany({
      where: {
        barberId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findByClient(clientId: string): Promise<Appointment[]> {
    return await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { startTime: 'desc' },
    });
  }

  async createTransactional(
    data: {
      clientId: string;
      barberId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
    },
    conflictingStatuses: string[]
  ): Promise<Appointment | null> {
    // Encapsulate read/write inside an interactive transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the barber record to prevent race conditions on scheduling conflicts (Postgres Row-Level Lock)
      // Since it's Postgres, we can run SELECT ... FOR UPDATE
      await tx.$executeRaw`
        SELECT 1 FROM "Barber" WHERE id = ${data.barberId} FOR UPDATE
      `;

      // 2. Query for conflicts
      // Overlap formula: proposed.start < existing.end AND proposed.end > existing.start
      const conflict = await tx.appointment.findFirst({
        where: {
          barberId: data.barberId,
          status: { in: conflictingStatuses },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      });

      if (conflict) {
        return null;
      }

      // 3. Create the appointment if no conflict exists
      return await tx.appointment.create({
        data: {
          clientId: data.clientId,
          barberId: data.barberId,
          serviceId: data.serviceId,
          startTime: data.startTime,
          endTime: data.endTime,
          status: 'PENDING',
        },
      });
    });
  }

  async updateStatus(id: string, status: string): Promise<Appointment> {
    return await prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async getFinanceReport(startDate?: Date, endDate?: Date): Promise<FinanceReport> {
    interface RevenueResultRow {
      grossRevenue: number;
      netRevenue: number;
    }
    interface CommissionResultRow {
      barberId: string;
      barberName: string;
      commission: number;
    }

    const dateCondition = startDate && endDate
      ? Prisma.sql`AND a."startTime" >= ${startDate} AND a."startTime" <= ${endDate}`
      : Prisma.sql``;

    // RNF07: Perform native aggregation directly in PostgreSQL
    const revenueResult = await prisma.$queryRaw<RevenueResultRow[]>`
      SELECT 
        COALESCE(SUM(s.price), 0)::float as "grossRevenue",
        COALESCE(SUM(s.price * (1 - s."commissionRate")), 0)::float as "netRevenue"
      FROM "Appointment" a
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a.status = 'COMPLETED'
      ${dateCondition}
    `;

    const commissionsResult = await prisma.$queryRaw<CommissionResultRow[]>`
      SELECT 
        a."barberId",
        u.name as "barberName",
        COALESCE(SUM(s.price * s."commissionRate"), 0)::float as "commission"
      FROM "Appointment" a
      JOIN "Service" s ON a."serviceId" = s.id
      JOIN "Barber" b ON a."barberId" = b.id
      JOIN "User" u ON b."userId" = u.id
      WHERE a.status = 'COMPLETED'
      ${dateCondition}
      GROUP BY a."barberId", u.name
    `;

    const grossRevenue = revenueResult[0]?.grossRevenue || 0;
    const netRevenue = revenueResult[0]?.netRevenue || 0;

    const barbersCommissions = commissionsResult.map((row) => ({
      barberId: row.barberId,
      barberName: row.barberName,
      commission: row.commission,
    }));

    return {
      grossRevenue,
      netRevenue,
      barbersCommissions,
    };
  }

  async getBarberPerformanceReport(
    barberId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BarberPerformanceReport> {
    const whereClause: Prisma.AppointmentWhereInput = {
      barberId,
      status: 'COMPLETED',
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Group chartData by date string YYYY-MM-DD
    const chartMap = new Map<string, { count: number; revenue: number }>();
    appointments.forEach((app) => {
      const dateStr = app.startTime.toISOString().split('T')[0];
      const current = chartMap.get(dateStr) || { count: 0, revenue: 0 };
      chartMap.set(dateStr, {
        count: current.count + 1,
        revenue: current.revenue + (app.service?.price || 0),
      });
    });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));

    // Group topServices by service name
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    appointments.forEach((app) => {
      const name = app.service?.name || 'Serviço';
      const current = serviceMap.get(name) || { count: 0, revenue: 0 };
      serviceMap.set(name, {
        count: current.count + 1,
        revenue: current.revenue + (app.service?.price || 0),
      });
    });

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      chartData,
      topServices,
    };
  }

  async getAdminCalendarMetrics(
    year: number,
    month?: number,
    day?: number
  ): Promise<{ metrics: CalendarMetric[]; dayDetails?: AdminCalendarDayResult }> {
    if (day !== undefined && month !== undefined) {
      // 1. DAY VIEW: return detailed hourly appointments for this exact date using precise local boundaries
      const baseDate = new Date(year, month - 1, day, 12, 0, 0);
      const start = startOfDay(baseDate);
      const end = endOfDay(baseDate);

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
        },
        include: {
          client: true,
          service: true,
          barber: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const detailedList: DayAppointmentDetail[] = appointments.map((app) => ({
        id: app.id,
        startTime: app.startTime,
        endTime: app.endTime,
        status: app.status,
        clientName: app.client?.name || 'Cliente',
        clientEmail: app.client?.email || '',
        barberName: app.barber?.user?.name || 'Barbeiro',
        serviceName: app.service?.name || 'Serviço',
        servicePrice: app.service?.price || 0,
      }));

      return {
        metrics: [],
        dayDetails: {
          date: dateStr,
          appointments: detailedList,
        },
      };
    } else if (month !== undefined) {
      // 2. MONTH VIEW: group by YYYY-MM-DD for the selected month
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      interface DayGroupRow {
        date: string;
        count: number;
        revenue: number;
        completed_count: number;
        pending_count: number;
        canceled_count: number;
        no_show_count: number;
      }

      const rows = await prisma.$queryRaw<DayGroupRow[]>`
        SELECT 
          TO_CHAR(a."startTime", 'YYYY-MM-DD') as date,
          COUNT(a.id)::int as count,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN s.price ELSE 0 END), 0)::float as revenue,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), 0)::int as completed_count,
          COALESCE(SUM(CASE WHEN a.status = 'PENDING' THEN 1 ELSE 0 END), 0)::int as pending_count,
          COALESCE(SUM(CASE WHEN a.status = 'CANCELED' THEN 1 ELSE 0 END), 0)::int as canceled_count,
          COALESCE(SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END), 0)::int as no_show_count
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        WHERE a."startTime" >= ${startOfMonth} AND a."startTime" <= ${endOfMonth}
        GROUP BY TO_CHAR(a."startTime", 'YYYY-MM-DD')
        ORDER BY date ASC
      `;

      return {
        metrics: rows.map((r) => ({
          date: r.date,
          count: Number(r.count),
          revenue: Number(r.revenue),
          completed_count: Number(r.completed_count),
          pending_count: Number(r.pending_count),
          canceled_count: Number(r.canceled_count),
          no_show_count: Number(r.no_show_count),
        })),
      };
    } else {
      // 3. YEAR VIEW: group by YYYY-MM for all 12 months
      const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      interface MonthGroupRow {
        date: string;
        count: number;
        revenue: number;
        completed_count: number;
        pending_count: number;
        canceled_count: number;
        no_show_count: number;
      }

      const rows = await prisma.$queryRaw<MonthGroupRow[]>`
        SELECT 
          TO_CHAR(a."startTime", 'YYYY-MM') as date,
          COUNT(a.id)::int as count,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN s.price ELSE 0 END), 0)::float as revenue,
          COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), 0)::int as completed_count,
          COALESCE(SUM(CASE WHEN a.status = 'PENDING' THEN 1 ELSE 0 END), 0)::int as pending_count,
          COALESCE(SUM(CASE WHEN a.status = 'CANCELED' THEN 1 ELSE 0 END), 0)::int as canceled_count,
          COALESCE(SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END), 0)::int as no_show_count
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        WHERE a."startTime" >= ${startOfYear} AND a."startTime" <= ${endOfYear}
        GROUP BY TO_CHAR(a."startTime", 'YYYY-MM')
        ORDER BY date ASC
      `;

      // Fill missing months with 0 so all 12 months are present
      const map = new Map<string, { count: number; revenue: number; completed_count: number; pending_count: number; canceled_count: number; no_show_count: number }>();
      rows.forEach((r) => {
        map.set(r.date, {
          count: Number(r.count),
          revenue: Number(r.revenue),
          completed_count: Number(r.completed_count),
          pending_count: Number(r.pending_count),
          canceled_count: Number(r.canceled_count),
          no_show_count: Number(r.no_show_count),
        });
      });

      const metrics: CalendarMetric[] = [];
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        const item = map.get(key) || { count: 0, revenue: 0, completed_count: 0, pending_count: 0, canceled_count: 0, no_show_count: 0 };
        metrics.push({
          date: key,
          count: item.count,
          revenue: item.revenue,
          completed_count: item.completed_count,
          pending_count: item.pending_count,
          canceled_count: item.canceled_count,
          no_show_count: item.no_show_count,
        });
      }

      return { metrics };
    }
  }

  async getBarberMonthOccupancy(
    barberId: string,
    year: number,
    month: number
  ): Promise<{ date: string; count: number }[]> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    interface OccupancyRow {
      date: string;
      count: number;
    }

    const rows = await prisma.$queryRaw<OccupancyRow[]>`
      SELECT 
        TO_CHAR("startTime", 'YYYY-MM-DD') as date,
        COUNT(id)::int as count
      FROM "Appointment"
      WHERE "barberId" = ${barberId}
        AND status IN ('PENDING', 'COMPLETED')
        AND "startTime" >= ${startOfMonth} AND "startTime" <= ${endOfMonth}
      GROUP BY TO_CHAR("startTime", 'YYYY-MM-DD')
    `;

    return rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }
}
