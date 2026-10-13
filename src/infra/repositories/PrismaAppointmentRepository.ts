import { AppointmentRepository, AppointmentWithRelations, CreateAppointmentData } from '@/core/domain/repositories/AppointmentRepository';
import { Appointment } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';
import { toService } from './mappers';

export class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    return await prisma.appointment.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null> {
    const row = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        clientContact: true,
        service: true,
      },
    });
    return row ? { ...row, service: toService(row.service) } : null;
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
    data: CreateAppointmentData,
    conflictingStatuses: string[]
  ): Promise<Appointment | null> {
    // Encapsulate read/write inside an interactive transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the barber record to prevent race conditions on scheduling conflicts (Postgres Row-Level Lock)
      // Since it's Postgres, we can run SELECT ... FOR UPDATE
      await tx.$queryRaw`
        SELECT 1 FROM "Barber" WHERE id = ${data.barberId} FOR UPDATE
      `;

      const service = await tx.service.findUnique({ where: { id: data.serviceId } });
      const barber = await tx.barber.findUnique({ where: { id: data.barberId }, include: { user: { select: { active: true } } } });
      if (!service?.active || !barber?.user.active) throw new Error('Serviço ou profissional indisponível.');
      const priceCents = service.price.mul(100).toDecimalPlaces(0).toNumber();
      const commissionCents = service.price.mul(service.commissionRate).mul(100).toDecimalPlaces(0).toNumber();
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
          clientId: data.clientId ?? null,
          clientContactId: data.clientContactId ?? null,
          barberId: data.barberId,
          serviceId: data.serviceId,
          startTime: data.startTime,
          endTime: data.endTime,
          origin: data.origin ?? 'ONLINE',
          createdById: data.createdById ?? null,
          status: 'PENDING',
          priceCents,
          commissionCents,
        },
      });
    });
  }

  async rescheduleTransactional(
    id: string,
    newStartTime: Date,
    newEndTime: Date,
    conflictingStatuses: string[]
  ): Promise<Appointment | null> {
    return await prisma.$transaction(async (tx) => {
      const existingAppt = await tx.appointment.findUnique({
        where: { id },
      });
      if (!existingAppt) return null;

      await tx.$queryRaw`
        SELECT 1 FROM "Barber" WHERE id = ${existingAppt.barberId} FOR UPDATE
      `;

      // Re-read after the lock; a cancellation or cron may have changed the booking.
      const current = await tx.appointment.findUnique({ where: { id } });
      if (!current || current.status !== 'PENDING' || current.startTime <= new Date()) return null;
      const conflict = await tx.appointment.findFirst({
        where: {
          barberId: existingAppt.barberId,
          id: { not: id },
          status: { in: conflictingStatuses },
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
        },
      });

      if (conflict) return null;

      return await tx.appointment.update({
        where: { id, status: 'PENDING', updatedAt: current.updatedAt },
        data: {
          reminded24h: false, reminded1h: false, reminded15m: false, remindedStart: false,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });
    });
  }

  async updateStatus(id: string, status: string, expectedStatus?: string): Promise<Appointment> {
    return await prisma.appointment.update({
      where: { id, ...(expectedStatus ? { status: expectedStatus } : {}) },
      data: { status },
    });
  }
}
