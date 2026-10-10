import { Appointment,Service,User } from '@/core/domain/models';

export type AppointmentWithRelations = Appointment & {
  client: User;
  service: Service;
};

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
  rescheduleTransactional(
    id: string,
    newStartTime: Date,
    newEndTime: Date,
    conflictingStatuses: string[]
  ): Promise<Appointment | null>;
  updateStatus(id: string, status: string, expectedStatus?: string): Promise<Appointment>;
}
