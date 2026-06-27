import { ServiceRepository } from '@/core/domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';

export class PrismaServiceRepository implements ServiceRepository {
  async findById(id: string): Promise<Service | null> {
    return await prisma.service.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Service[]> {
    return await prisma.service.findMany();
  }

  async create(data: {
    name: string;
    price: number;
    durationMinutes: number;
    commissionRate: number;
  }): Promise<Service> {
    return await prisma.service.create({
      data,
    });
  }
}
