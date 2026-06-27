import { Service } from '@/generated/prisma/client';

export interface ServiceRepository {
  findById(id: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
  create(data: {
    name: string;
    price: number;
    durationMinutes: number;
    commissionRate: number;
  }): Promise<Service>;
}
