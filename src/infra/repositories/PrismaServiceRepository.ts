import { ServiceRepository } from '@/core/domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';

export class PrismaServiceRepository implements ServiceRepository {
  async findById(id: string): Promise<Service | null> {
    return await prisma.service.findUnique({
      where: { id },
    });
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<Service[]> {
    if (options?.activeOnly) {
      return await prisma.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
    }
    return await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    price: number;
    durationMinutes: number;
    commissionRate: number;
    image?: string | null;
    active?: boolean;
  }): Promise<Service> {
    return await prisma.service.create({
      data: {
        ...data,
        active: data.active ?? true,
      },
    });
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
    return await prisma.service.update({
      where: { id },
      data,
    });
  }
}
