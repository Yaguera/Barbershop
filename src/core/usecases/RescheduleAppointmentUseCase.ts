import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { Appointment } from '@/generated/prisma/client';
import { getLocalDayOfWeek, getLocalHoursMinutes } from '../utils/date-utils';

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  clientId: string;
  newStartTime: Date;
}

export class RescheduleAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private serviceRepository: ServiceRepository,
    private barberRepository: BarberRepository
  ) {}

  async execute(request: RescheduleAppointmentRequest): Promise<Appointment> {
    const { appointmentId, clientId, newStartTime } = request;

    if (newStartTime < new Date()) {
      throw new Error('Não é possível reagendar para datas ou horários passados.');
    }

    const existingAppt = await this.appointmentRepository.findById(appointmentId);
    if (!existingAppt || existingAppt.clientId !== clientId) {
      throw new Error('Agendamento não encontrado ou não autorizado.');
    }

    if (existingAppt.status !== 'PENDING' && existingAppt.status !== 'CONFIRMED') {
      throw new Error('Apenas agendamentos ativos podem ser reagendados.');
    }

    if (existingAppt.startTime < new Date()) {
      throw new Error('Agendamentos passados ou em andamento não podem ser reagendados.');
    }

    const service = await this.serviceRepository.findById(existingAppt.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const barber = await this.barberRepository.findById(existingAppt.barberId);
    if (!barber) {
      throw new Error('Barber not found');
    }

    const dayOfWeek = getLocalDayOfWeek(newStartTime);
    if (!barber.workDays.includes(dayOfWeek)) {
      throw new Error('O profissional não atende neste dia da semana.');
    }

    const [startHour, startMin] = barber.workStart.split(':').map(Number);
    const [endHour, endMin] = barber.workEnd.split(':').map(Number);

    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    const { hours: startH, minutes: startM } = getLocalHoursMinutes(newStartTime);
    const appStartMinutes = startH * 60 + startM;
    const newEndTime = new Date(newStartTime.getTime() + service.durationMinutes * 60 * 1000);
    const { hours: endH, minutes: endM } = getLocalHoursMinutes(newEndTime);
    const appEndMinutes = endH * 60 + endM;

    if (appStartMinutes < workStartMinutes || appEndMinutes > workEndMinutes) {
      throw new Error('Horário fora do expediente do profissional.');
    }

    const conflictingStatuses = ['PENDING', 'COMPLETED'];
    const updatedAppt = await this.appointmentRepository.rescheduleTransactional(
      appointmentId,
      newStartTime,
      newEndTime,
      conflictingStatuses
    );

    if (!updatedAppt) {
      const error = new Error('Este horário já não está mais disponível. Escolha outra opção.') as Error & { status?: number };
      error.status = 409;
      throw error;
    }

    return updatedAppt;
  }
}
