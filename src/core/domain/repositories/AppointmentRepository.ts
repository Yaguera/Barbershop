import { Appointment, ClientContact, Service, User } from '@/core/domain/models';

export type AppointmentWithRelations = Appointment & {
  client: User | null;
  clientContact?: ClientContact | null;
  service: Service;
};

export interface CreateAppointmentData {
  clientId?: string | null;
  clientContactId?: string | null;
  barberId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  origin?: 'ONLINE' | 'WHATSAPP' | 'WALK_IN' | string;
  createdById?: string | null;
}

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null>;
  findByBarberAndDate(barberId: string, startOfDay: Date, endOfDay: Date): Promise<Appointment[]>;
  findByClient(clientId: string): Promise<Appointment[]>;
  createTransactional(
    data: CreateAppointmentData,
    conflictingStatuses: string[]
  ): Promise<Appointment | null>;
  rescheduleTransactional(
    id: string,
    newStartTime: Date,
    newEndTime: Date,
    conflictingStatuses: string[]
  ): Promise<Appointment | null>;
  updateStatus(id: string, status: string, expectedStatus?: string): Promise<Appointment>;
}
