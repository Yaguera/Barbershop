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

  async findAll(): Promise<BarberWithUser[]> {
    return await prisma.barber.findMany({
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
}
