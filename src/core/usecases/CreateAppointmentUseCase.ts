import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { Appointment } from '@/generated/prisma/client';

export interface CreateAppointmentRequest {
  clientId: string;
  barberId: string;
  serviceId: string;
  startTime: Date;
}

export class CreateAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private serviceRepository: ServiceRepository,
    private barberRepository: BarberRepository
  ) {}

  async execute(request: CreateAppointmentRequest): Promise<Appointment> {
    const { clientId, barberId, serviceId, startTime } = request;

    // Validate that the appointment time is not in the past
    if (startTime < new Date()) {
      throw new Error('Não é possível realizar agendamentos em datas ou horários passados.');
    }

    // 1. Validate Service
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // 2. Validate Barber
    const barber = await this.barberRepository.findById(barberId);
    if (!barber) {
      throw new Error('Barber not found');
    }

    // Check if the appointment day is a work day
    const dayOfWeek = startTime.getDay();
    if (!barber.workDays.includes(dayOfWeek)) {
      throw new Error('Barber does not work on this day of the week');
    }

    // Check if appointment is within working hours
    const [startHour, startMin] = barber.workStart.split(':').map(Number);
    const [endHour, endMin] = barber.workEnd.split(':').map(Number);

    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    const appStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);
    const appEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (appStartMinutes < workStartMinutes || appEndMinutes > workEndMinutes) {
      throw new Error('Appointment time is outside of barber working hours');
    }

    // 3. Attempt to create appointment transactionally
    // We pass statuses that conflict: PENDING and COMPLETED (RN06.2, RN06.3)
    const conflictingStatuses = ['PENDING', 'COMPLETED'];
    const appointment = await this.appointmentRepository.createTransactional(
      {
        clientId,
        barberId,
        serviceId,
        startTime,
        endTime,
      },
      conflictingStatuses
    );

    if (!appointment) {
      // Conflict error (RN06.3 - 409 Conflict equivalent)
      const error = new Error('The requested time slot is no longer available') as Error & { status?: number };
      error.status = 409;
      throw error;
    }

    return appointment;
  }
}
