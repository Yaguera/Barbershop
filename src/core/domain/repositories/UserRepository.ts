import { User } from '@/generated/prisma/client';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    name?: string | null;
    email: string;
    passwordHash?: string | null;
    role?: string;
    image?: string | null;
    phone?: string | null;
  }): Promise<User>;
  update(
    id: string,
    data: {
      name?: string | null;
      email?: string;
      passwordHash?: string | null;
      image?: string | null;
      phone?: string | null;
    }
  ): Promise<User>;
}
