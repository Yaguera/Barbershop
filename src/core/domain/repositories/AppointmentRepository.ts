import { Appointment, Service, User } from '@/generated/prisma/client';

export type AppointmentWithRelations = Appointment & {
  client: User;
  service: Service;
};

export interface BarberCommission {
  barberId: string;
  barberName: string;
  commission: number;
}

export interface FinanceReport {
  grossRevenue: number;
  netRevenue: number;
  barbersCommissions: BarberCommission[];
}

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null>;
  findByBarberAndDate(barberId: string, startOfDay: Date, endOfDay: Date): Promise<Appointment[]>;
  findByClient(clientId: string): Promise<Appointment[]>;
  createTransactional(
    data: {
      clientId: string;
      barberId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
    },
    conflictingStatuses: string[]
  ): Promise<Appointment | null>;
  updateStatus(id: string, status: string): Promise<Appointment>;
  getFinanceReport(): Promise<FinanceReport>;
}
