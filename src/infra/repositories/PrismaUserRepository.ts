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
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'CLIENT',
        image: data.image,
        phone: data.phone,
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
      },
    });
  }
}
