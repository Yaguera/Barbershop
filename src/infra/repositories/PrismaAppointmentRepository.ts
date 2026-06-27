import { AppointmentRepository, AppointmentWithRelations, FinanceReport } from '@/core/domain/repositories/AppointmentRepository';
import { Appointment, Service, User } from '@/generated/prisma/client';

let MOCK_APPOINTMENTS: Appointment[] = [];

export class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    return MOCK_APPOINTMENTS.find(a => a.id === id) || null;
  }

  async findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null> {
    const app = MOCK_APPOINTMENTS.find(a => a.id === id);
    if (!app) return null;
    return {
      ...app,
      client: { id: app.clientId, name: 'Client' } as User,
      service: { id: app.serviceId, name: 'Service', price: 25 } as Service,
    } as AppointmentWithRelations;
  }

  async findByBarberAndDate(barberId: string, startOfDay: Date, endOfDay: Date): Promise<Appointment[]> {
    return MOCK_APPOINTMENTS.filter(a => {
      const time = new Date(a.startTime).getTime();
      return a.barberId === barberId && 
             time >= startOfDay.getTime() && 
             time <= endOfDay.getTime();
    });
  }

  async findByClient(clientId: string): Promise<Appointment[]> {
    return MOCK_APPOINTMENTS.filter(a => a.clientId === clientId);
  }

  async createTransactional(
    data: {
      clientId: string;
      barberId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
    },
    conflictingStatuses: string[]
  ): Promise<Appointment | null> {
    // Conflict check
    const conflict = MOCK_APPOINTMENTS.find(a => {
      if (a.barberId !== data.barberId) return false;
      if (!conflictingStatuses.includes(a.status)) return false;
      const aStart = new Date(a.startTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      const dStart = data.startTime.getTime();
      const dEnd = data.endTime.getTime();
      return (dStart < aEnd && dEnd > aStart);
    });

    if (conflict) {
      return null;
    }

    const newAppointment = {
      id: `app-${Math.random()}`,
      clientId: data.clientId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Appointment;

    MOCK_APPOINTMENTS.push(newAppointment);
    return newAppointment;
  }

  async updateStatus(id: string, status: string): Promise<Appointment> {
    const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    MOCK_APPOINTMENTS[index].status = status as any;
    return MOCK_APPOINTMENTS[index];
  }

  async getFinanceReport(): Promise<FinanceReport> {
    return {
      grossRevenue: 1000,
      netRevenue: 500,
      barbersCommissions: [
        { barberId: 'barber-1', barberName: 'Lucas Oliveira', commission: 250 },
        { barberId: 'barber-2', barberName: 'Rafael Santos', commission: 250 }
      ]
    };
  }
}
