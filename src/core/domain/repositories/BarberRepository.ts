import { Barber, User } from '@/generated/prisma/client';

export type BarberWithUser = Barber & { user: User };

export interface BarberRepository {
  findById(id: string): Promise<BarberWithUser | null>;
  findByUserId(userId: string): Promise<Barber | null>;
  findAll(): Promise<BarberWithUser[]>;
  create(data: {
    userId: string;
    workDays: number[];
    workStart: string;
    workEnd: string;
  }): Promise<Barber>;
}
