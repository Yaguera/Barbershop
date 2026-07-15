import { BarberRepository, BarberWithUser } from '@/core/domain/repositories/BarberRepository';
import { Barber } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';

export class PrismaBarberRepository implements BarberRepository {
  async findById(id: string): Promise<BarberWithUser | null> {
    return await prisma.barber.findUnique({
      where: { id },
      include: { user: true },
    }) as BarberWithUser | null;
  }

  async findByUserId(userId: string): Promise<Barber | null> {
    return await prisma.barber.findUnique({
      where: { userId },
    });
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<BarberWithUser[]> {
    return await prisma.barber.findMany({
      where: options?.activeOnly ? { user: { active: true } } : undefined,
      include: { user: true },
    }) as BarberWithUser[];
  }

  async create(data: {
    userId: string;
    workDays: number[];
    workStart: string;
    workEnd: string;
  }): Promise<Barber> {
    return await prisma.barber.create({
      data: {
        userId: data.userId,
        workDays: data.workDays,
        workStart: data.workStart,
        workEnd: data.workEnd,
      },
    });
  }

  async getBarberSpecialty(barberId: string): Promise<string | null> {
    const grouped = await prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        barberId,
        status: 'COMPLETED',
      },
      _count: {
        serviceId: true,
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: 1,
    });

    if (!grouped || grouped.length === 0) {
      return null;
    }

    const topServiceId = grouped[0].serviceId;
    const service = await prisma.service.findUnique({
      where: { id: topServiceId },
    });

    return service ? service.name : null;
  }
}
