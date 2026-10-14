import { PrismaAdminCalendarRepository } from './PrismaAdminCalendarRepository';
import type { CalendarFilters } from '@/core/domain/repositories/AdminCalendarRepository';
import { businessDate, formatPeriodRange, getServiceColor } from '@/core/utils/report-period';
import { AdminDashboardMetricsReport,AppointmentReportRepository,BarberDetailedMetricsReport,BarberPerformanceReport,FinanceReport } from '@/core/domain/repositories/AppointmentReportRepository';
import { getYYYYMMDD } from '@/core/utils/date-utils';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';
export class PrismaAppointmentReportRepository implements AppointmentReportRepository {
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
        COALESCE(SUM((a."priceCents" / 100.0)), 0)::float as "grossRevenue",
        COALESCE(SUM((a."priceCents" - a."commissionCents") / 100.0), 0)::float as "netRevenue"
      FROM "Appointment" a
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a.status = 'COMPLETED'
      ${dateCondition}
    `;

    const commissionsResult = await prisma.$queryRaw<CommissionResultRow[]>`
      SELECT 
        a."barberId",
        u.name as "barberName",
        COALESCE(SUM(a."commissionCents" / 100.0), 0)::float as "commission"
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
      const dateStr = getYYYYMMDD(app.startTime);
      const current = chartMap.get(dateStr) || { count: 0, revenue: 0 };
      chartMap.set(dateStr, {
        count: current.count + 1,
        revenue: current.revenue + (app.priceCents / 100),
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
        revenue: current.revenue + (app.priceCents / 100),
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

  async getBarberDetailedMetrics(
    barberId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BarberDetailedMetricsReport> {
    const baseWhere: Prisma.AppointmentWhereInput = {
      barberId,
      status: 'COMPLETED',
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Total completed appointments via aggregate
    const aggregateResult = await prisma.appointment.aggregate({
      where: baseWhere,
      _count: {
        _all: true,
      },
    });
    const totalAppointments = aggregateResult._count._all;

    // Status counts for cancellations and no-shows in period
    const statusCounts = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        barberId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { _all: true },
    });
    const canceledCount = statusCounts.find((s) => s.status === 'CANCELED')?._count._all || 0;
    const noShowCount = statusCounts.find((s) => s.status === 'NO_SHOW')?._count._all || 0;

    // Group by serviceId using groupBy
    const serviceGroups = await prisma.appointment.groupBy({
      by: ['serviceId'],
      _sum: { priceCents: true },
      where: baseWhere,
      _count: {
        _all: true,
      },
    });

    const allServices = await prisma.service.findMany({
      where: {
        id: {
          in: serviceGroups.map((g) => g.serviceId),
        },
      },
    });
    const serviceMap = new Map(allServices.map((s) => [s.id, s]));

    let totalRevenue = 0;
    const servicesDistribution = serviceGroups
      .map((g) => {
        const count = g._count._all;
        const svc = serviceMap.get(g.serviceId);
        const name = svc?.name || 'Serviço';
        const revenue = (g._sum.priceCents || 0) / 100;
        totalRevenue += revenue;
        const percentage = totalAppointments > 0 ? Number(((count / totalAppointments) * 100).toFixed(1)) : 0;
        return {
          name,
          count,
          revenue,
          percentage,
          fill: getServiceColor(name),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Fetch appointments with service price for daily chart evolution
    const completedApps = await prisma.appointment.findMany({
      where: baseWhere,
      include: {
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const commissionGroups = new Map<string, { serviceName: string; priceCents: number; commissionCents: number; count: number }>();
    for (const appointment of completedApps) {
      const key = `${appointment.serviceId}:${appointment.priceCents}:${appointment.commissionCents}`;
      const group = commissionGroups.get(key) || { serviceName: appointment.service.name, priceCents: appointment.priceCents, commissionCents: appointment.commissionCents, count: 0 };
      group.count++;
      commissionGroups.set(key, group);
    }

    const totalCommission = completedApps.reduce((sum, app) => sum + (app.commissionCents / 100), 0);

    const durationDays = startDate.getTime() === 0
      ? 9999
      : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const dailyMap = new Map<string, { count: number; revenue: number }>();

    // Pre-fill daily slots with 0 when inside a month/week range so days with 0 show as 0
    if (durationDays <= 31 && startDate.getTime() > 0) {
      const curDay = new Date(startDate);
      while (curDay <= endDate) {
        const key = curDay.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
        });
        dailyMap.set(key, { count: 0, revenue: 0 });
        curDay.setDate(curDay.getDate() + 1);
      }
    }

    completedApps.forEach((app) => {
      let dateStr: string;
      if (startDate.getTime() === 0 || durationDays > 365) {
        // Multi-year or general view: include year so different years never collide!
        dateStr = app.startTime.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          month: 'short',
          year: 'numeric',
        });
      } else if (durationDays <= 31) {
        dateStr = app.startTime.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
        });
      } else {
        dateStr = app.startTime.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }

      const cur = dailyMap.get(dateStr) || { count: 0, revenue: 0 };
      dailyMap.set(dateStr, {
        count: cur.count + 1,
        revenue: cur.revenue + (app.priceCents / 100),
      });
    });

    const dailyRevenueChart = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    }));

    return {
      totalAppointments,
      totalRevenue,
      totalCommission,
      commissionBreakdown: [...commissionGroups.values()],
      canceledCount,
      noShowCount,
      dailyRevenueChart,
      servicesDistribution,
      periodLabel: formatPeriodRange(startDate, endDate),
    };
  }

  async getAdminCalendarMetrics(year: number, month?: number, day?: number, filters?: CalendarFilters) {
    return new PrismaAdminCalendarRepository().getMetrics(year, month, day, filters);
  }

  async getBarberMonthOccupancy(
    barberId: string,
    year: number,
    month: number
  ): Promise<{ date: string; count: number }[]> {
    const startOfMonth = businessDate(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = businessDate(year, month, 0, 23, 59, 59, 999);

    interface OccupancyRow {
      date: string;
      count: number;
    }

    const rows = await prisma.$queryRaw<OccupancyRow[]>`
      SELECT 
        TO_CHAR("startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date,
        COUNT(id)::int as count
      FROM "Appointment"
      WHERE "barberId" = ${barberId}
        AND status IN ('PENDING', 'COMPLETED')
        AND "startTime" >= ${startOfMonth} AND "startTime" <= ${endOfMonth}
      GROUP BY TO_CHAR("startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    `;

    return rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  async getAdminDashboardMetrics(
    startDate: Date,
    endDate: Date,
    barberId?: string
  ): Promise<AdminDashboardMetricsReport> {
    const baseWhere: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      ...(barberId && barberId !== 'all' ? { barberId } : {}),
    };

    const durationMs = endDate.getTime() - startDate.getTime() + 1;
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const prevEndDate = new Date(startDate.getTime());

    const prevWhere: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: prevStartDate,
        lt: prevEndDate,
      },
      status: 'COMPLETED',
      ...(barberId && barberId !== 'all' ? { barberId } : {}),
    };

    // Parallel aggregation queries without blocking Node Event Loop
    const [
      completedAppointments,
      prevCompletedAppointments,
      statusCounts,
      newClientsCount,
      serviceGroups,
      allServices,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { ...baseWhere, status: 'COMPLETED' },
        include: { service: true, receipt: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.appointment.findMany({
        where: prevWhere,
        include: { service: true, receipt: true },
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { ...baseWhere, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      prisma.service.findMany(),
    ]);

    const totalRealized = completedAppointments.reduce((sum, app) => sum + (app.priceCents / 100), 0);
    const confirmedReceipts = completedAppointments.filter((app) => app.receipt?.status === 'CONFIRMED');
    const totalReceived = confirmedReceipts.reduce((sum, app) => sum + (app.receipt!.amountCents / 100), 0);
    const pendingAppointments = completedAppointments.filter((app) => !app.receipt || app.receipt.status !== 'CONFIRMED');
    const totalPending = pendingAppointments.reduce((sum, app) => sum + (app.priceCents / 100), 0);
    const receivedCount = confirmedReceipts.length;
    const pendingPaymentCount = pendingAppointments.length;

    // totalRevenue reflete o recebido confirmado; se não houver registros de caixa legados, cai para realizado
    const totalRevenue = totalReceived > 0 || confirmedReceipts.length > 0 ? totalReceived : totalRealized;
    const prevTotalRevenue = prevCompletedAppointments.reduce((sum, app) => {
      if (app.receipt?.status === 'CONFIRMED') {
        return sum + (app.receipt.amountCents / 100);
      }
      return sum + (app.priceCents / 100);
    }, 0);
    
    let growthPercentage = '+0.0%';
    let growthTrend: 'up' | 'down' | 'neutral' | 'no_basis' = 'neutral';

    if (prevTotalRevenue > 0) {
      const growth = ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;
      if (Math.abs(growth) < 0.05) {
        growthPercentage = '0.0%';
        growthTrend = 'neutral';
      } else if (growth > 0) {
        growthPercentage = `+${growth.toFixed(1)}%`;
        growthTrend = 'up';
      } else {
        growthPercentage = `${growth.toFixed(1)}%`;
        growthTrend = 'down';
      }
    } else if (totalRevenue > 0) {
      growthPercentage = 'Sem base de comparação';
      growthTrend = 'no_basis';
    } else {
      growthPercentage = '0.0%';
      growthTrend = 'neutral';
    }

    const completedStatus = statusCounts.find((s) => s.status === 'COMPLETED');
    const completedCount = completedStatus ? completedStatus._count._all : completedAppointments.length;

    const canceledCount = statusCounts.find((s) => s.status === 'CANCELED')?._count._all || 0;
    const noShowCount = statusCounts.find((s) => s.status === 'NO_SHOW')?._count._all || 0;

    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    const timeMap = new Map<string, { revenue: number; completed: number }>();

    // Pre-fill daily slots with 0 when within 31 days so days without appointments show as 0
    if (durationDays <= 31 && startDate.getTime() > 0) {
      const curDay = new Date(startDate);
      while (curDay <= endDate) {
        const key = curDay.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
        });
        timeMap.set(key, { revenue: 0, completed: 0 });
        curDay.setDate(curDay.getDate() + 1);
      }
    }

    completedAppointments.forEach((app) => {
      let label: string;
      if (durationDays <= 2) {
        label = app.startTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      } else if (durationDays <= 31) {
        label = app.startTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
      } else if (durationDays <= 365) {
        label = app.startTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
      } else {
        label = app.startTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short', year: 'numeric' });
      }

      const cur = timeMap.get(label) || { revenue: 0, completed: 0 };
      timeMap.set(label, {
        revenue: cur.revenue + (app.priceCents / 100),
        completed: cur.completed + 1,
      });
    });

    const revenueByTime = Array.from(timeMap.entries()).map(([timeLabel, data]) => ({
      timeLabel,
      revenue: data.revenue,
      completed: data.completed,
    }));

    const serviceMap = new Map(allServices.map((s) => [s.id, s.name]));
    const totalServiceCount = serviceGroups.reduce((sum, g) => sum + g._count._all, 0);

    const servicesDistribution = serviceGroups
      .map((g) => {
        const count = g._count._all;
        const name = serviceMap.get(g.serviceId) || 'Outros';
        const percentage = totalServiceCount > 0 ? Number(((count / totalServiceCount) * 100).toFixed(1)) : 0;
        return {
          name,
          value: count,
          percentage,
          fill: getServiceColor(name),
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      totalRevenue,
      totalRealized,
      totalReceived,
      totalPending,
      completedCount,
      receivedCount,
      pendingPaymentCount,
      canceledCount,
      noShowCount,
      newClientsCount,
      growthPercentage,
      growthTrend,
      revenueByTime,
      servicesDistribution,
      periodLabel: formatPeriodRange(startDate, endDate),
    };
  }
}
