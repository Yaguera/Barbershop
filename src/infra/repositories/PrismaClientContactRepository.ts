import { ClientContact } from '@/core/domain/models';
import { ClientContactRepository } from '@/core/domain/repositories/ClientContactRepository';
import { prisma } from '../db/prisma-client';

export class PrismaClientContactRepository implements ClientContactRepository {
  async findById(id: string): Promise<ClientContact | null> {
    return await prisma.clientContact.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; phone?: string | null; email?: string | null }): Promise<ClientContact> {
    return await prisma.clientContact.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
      },
    });
  }

  async search(query: string, limit = 10): Promise<ClientContact[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    return await prisma.clientContact.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { phone: { contains: trimmed } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
