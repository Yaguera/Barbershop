import { User } from '@/generated/prisma/client';

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  totalAppointments: number;
  completedServices: string[];
  totalSpent: number;
}

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
    active?: boolean;
  }): Promise<User>;
  update(
    id: string,
    data: {
      name?: string | null;
      email?: string;
      passwordHash?: string | null;
      image?: string | null;
      phone?: string | null;
      active?: boolean;
    }
  ): Promise<User>;
  softDelete(id: string): Promise<User>;
  getClientSummaries(): Promise<ClientSummary[]>;
}
