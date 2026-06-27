import { BarberRepository, BarberWithUser } from '@/core/domain/repositories/BarberRepository';
import { Barber } from '@/generated/prisma/client';

const MOCK_BARBERS = [
  {
    id: 'barber-1',
    userId: 'user-barber-1',
    bio: 'Especialista Premium',
    workDays: [1, 2, 3, 4, 5, 6],
    workStart: '09:00',
    workEnd: '19:00',
    user: { id: 'user-barber-1', name: 'Lucas Oliveira', image: '/images/barber_portrait.png', email: 'lucas@barber.com' }
  },
  {
    id: 'barber-2',
    userId: 'user-barber-2',
    bio: 'Mestre das Tesouras',
    workDays: [1, 2, 3, 4, 5, 6],
    workStart: '10:00',
    workEnd: '20:00',
    user: { id: 'user-barber-2', name: 'Rafael Santos', image: '/images/barber_portrait.png', email: 'rafael@barber.com' }
  }
] as unknown as BarberWithUser[];

export class PrismaBarberRepository implements BarberRepository {
  async findAll(): Promise<BarberWithUser[]> {
    return MOCK_BARBERS;
  }
  
  async findById(id: string): Promise<BarberWithUser | null> {
    return MOCK_BARBERS.find(b => b.id === id) || null;
  }
  
  async findByUserId(userId: string): Promise<Barber | null> {
    return MOCK_BARBERS.find(b => b.userId === userId) || null;
  }
  
  async create(data: any): Promise<Barber> {
    const newBarber = {
      id: `barber-${Math.random()}`,
      userId: data.userId,
      workDays: data.workDays,
      workStart: data.workStart,
      workEnd: data.workEnd,
      bio: null,
    } as unknown as Barber;
    
    return newBarber;
  }
}
