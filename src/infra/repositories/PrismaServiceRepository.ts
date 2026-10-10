import { Service } from '@/core/domain/models';
import { ServiceRepository } from '@/core/domain/repositories/ServiceRepository';
import { prisma } from '../db/prisma-client';
import { toService } from './mappers';

export class PrismaServiceRepository implements ServiceRepository {
  async findById(id: string): Promise<Service | null> {
    const row = await prisma.service.findUnique({ where: { id } });
    return row ? toService(row) : null;
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<Service[]> {
    if (options?.activeOnly) {
      return (await prisma.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      })).map(toService);
    }
    return (await prisma.service.findMany({
      orderBy: { name: 'asc' },
    })).map(toService);
  }

  async create(data: {
    name: string;
    price: number;
    durationMinutes: number;
    commissionRate: number;
    image?: string | null;
    active?: boolean;
  }): Promise<Service> {
    return toService(await prisma.service.create({
      data: {
        ...data,
        active: data.active ?? true,
      },
    }));
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      durationMinutes: number;
      commissionRate: number;
      image?: string | null;
      active?: boolean;
    }>
  ): Promise<Service> {
    return toService(await prisma.service.update({
      where: { id },
      data,
    }));
  }
}
