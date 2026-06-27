import { ServiceRepository } from '@/core/domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';

const MOCK_SERVICES = [
  {
    id: 'service-1',
    name: 'Social',
    price: 25.0,
    durationMinutes: 30,
    commissionRate: 50.0,
  },
  {
    id: 'service-2',
    name: 'Barba',
    price: 25.0,
    durationMinutes: 30,
    commissionRate: 50.0,
  },
  {
    id: 'service-3',
    name: 'Combo (Corte + Barba)',
    price: 45.0,
    durationMinutes: 60,
    commissionRate: 50.0,
  }
] as unknown as Service[];

export class PrismaServiceRepository implements ServiceRepository {
  async findAll(): Promise<Service[]> {
    return MOCK_SERVICES;
  }
  
  async findById(id: string): Promise<Service | null> {
    return MOCK_SERVICES.find(s => s.id === id) || null;
  }
  
  async create(data: any): Promise<Service> {
    const newService = {
      id: `service-${Math.random()}`,
      name: data.name,
      price: data.price,
      durationMinutes: data.durationMinutes,
      commissionRate: data.commissionRate,
    } as unknown as Service;
    return newService;
  }
}
