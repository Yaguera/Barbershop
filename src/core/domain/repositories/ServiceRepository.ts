import { Service } from '@/generated/prisma/client';

export interface ServiceRepository {
  findById(id: string): Promise<Service | null>;
  findAll(options?: { activeOnly?: boolean }): Promise<Service[]>;
  create(data: {
    name: string;
    price: number;
    durationMinutes: number;
    commissionRate: number;
    image?: string | null;
    active?: boolean;
  }): Promise<Service>;
  update(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      durationMinutes: number;
      commissionRate: number;
      image?: string | null;
      active?: boolean;
    }>
  ): Promise<Service>;
}
