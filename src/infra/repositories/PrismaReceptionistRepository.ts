import { Receptionist } from '@/core/domain/models';
import {
  ReceptionistRepository,
  ReceptionistWithUser,
} from '@/core/domain/repositories/ReceptionistRepository';
import { prisma } from '../db/prisma-client';

export class PrismaReceptionistRepository implements ReceptionistRepository {
  async findById(id: string): Promise<ReceptionistWithUser | null> {
    const row = await prisma.receptionist.findUnique({
      where: { id },
      include: { user: true },
    });
    return row;
  }

  async findByUserId(userId: string): Promise<Receptionist | null> {
    return await prisma.receptionist.findUnique({
      where: { userId },
    });
  }

  async findAll(): Promise<ReceptionistWithUser[]> {
    return await prisma.receptionist.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string): Promise<Receptionist> {
    return await prisma.receptionist.create({
      data: { userId },
    });
  }

  async softDelete(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
        sessionVersion: { increment: 1 },
      },
    });
  }
}
