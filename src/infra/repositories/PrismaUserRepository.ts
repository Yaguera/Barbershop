import { UserRepository } from '@/core/domain/repositories/UserRepository';
import { User } from '@/generated/prisma/client';
import { prisma } from '../db/prisma-client';

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    name?: string | null;
    email: string;
    passwordHash?: string | null;
    role?: string;
    image?: string | null;
    phone?: string | null;
    active?: boolean;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'CLIENT',
        image: data.image,
        phone: data.phone,
        active: data.active ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string | null;
      email?: string;
      passwordHash?: string | null;
      image?: string | null;
      phone?: string | null;
      active?: boolean;
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        image: data.image,
        phone: data.phone,
        active: data.active,
      },
    });
  }

  async softDelete(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async getClientSummaries() {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        appointments: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => {
      const completedApps = client.appointments.filter((a) => a.status === 'COMPLETED');
      const totalSpent = completedApps.reduce((sum, a) => sum + (a.service?.price || 0), 0);
      const completedServices = Array.from(new Set(completedApps.map((a) => a.service?.name).filter(Boolean) as string[]));

      return {
        id: client.id,
        name: client.name || 'Sem nome',
        email: client.email,
        phone: client.phone || null,
        createdAt: client.createdAt,
        totalAppointments: client.appointments.length,
        completedServices,
        totalSpent,
      };
    });
  }
}
