import { UserRepository } from '@/core/domain/repositories/UserRepository';
import { User } from '@/generated/prisma/client';

const MOCK_USERS: User[] = [
  {
    id: 'fake-client-id-123',
    name: 'Visitante VIP',
    email: 'demo@exemplo.com',
    role: 'CLIENT',
    image: null,
    phone: '(11) 99999-9999',
    emailVerified: null,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-barber-1',
    name: 'Lucas Oliveira',
    email: 'lucas@barber.com',
    role: 'BARBER',
    image: '/images/barber_portrait.png',
    phone: '(11) 98888-8888',
    emailVerified: null,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-barber-2',
    name: 'Rafael Santos',
    email: 'rafael@barber.com',
    role: 'BARBER',
    image: '/images/barber_portrait.png',
    phone: '(11) 97777-7777',
    emailVerified: null,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    return MOCK_USERS.find(u => u.id === id) || null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return MOCK_USERS.find(u => u.email === email) || null;
  }
  
  async create(data: any): Promise<User> {
    const newUser = {
      id: `user-${Math.random()}`,
      name: data.name,
      email: data.email,
      role: data.role || 'CLIENT',
      image: data.image,
      phone: data.phone,
      emailVerified: null,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
    MOCK_USERS.push(newUser);
    return newUser;
  }
  
  async update(id: string, data: any): Promise<User> {
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    MOCK_USERS[index] = { ...MOCK_USERS[index], ...data };
    return MOCK_USERS[index];
  }
}
