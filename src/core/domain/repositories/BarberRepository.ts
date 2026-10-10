import { Barber,User } from '@/core/domain/models';

export type BarberWithUser = Barber & { user: User };

export interface BarberRepository {
  findById(id: string): Promise<BarberWithUser | null>;
  findByUserId(userId: string): Promise<Barber | null>;
  findAll(options?: { activeOnly?: boolean }): Promise<BarberWithUser[]>;
  create(data: {
    userId: string;
    workDays: number[];
    workStart: string;
    workEnd: string;
  }): Promise<Barber>;
  getBarberSpecialty(barberId: string): Promise<string | null>;
}
