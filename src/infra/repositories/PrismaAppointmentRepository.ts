import { AppointmentRepository, AppointmentWithRelations, FinanceReport } from '@/core/domain/repositories/AppointmentRepository';
import { Appointment } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';

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

  async getFinanceReport(): Promise<FinanceReport> {
    interface RevenueResultRow {
      grossRevenue: number;
      netRevenue: number;
    }
    interface CommissionResultRow {
      barberId: string;
      barberName: string;
      commission: number;
    }

    // RNF07: Perform native aggregation directly in PostgreSQL
    const revenueResult = await prisma.$queryRaw<RevenueResultRow[]>`
      SELECT 
        COALESCE(SUM(s.price), 0)::float as "grossRevenue",
        COALESCE(SUM(s.price * (1 - s."commissionRate")), 0)::float as "netRevenue"
      FROM "Appointment" a
      JOIN "Service" s ON a."serviceId" = s.id
      WHERE a.status = 'COMPLETED'
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
}
