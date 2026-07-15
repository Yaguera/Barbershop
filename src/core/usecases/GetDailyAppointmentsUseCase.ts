import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { startOfDay, endOfDay, parseLocalDate } from '../utils/date-utils';

export interface GetDailyAppointmentsRequest {
  barberId: string;
  dateStr?: string; // YYYY-MM-DD or ISO
}

export class GetDailyAppointmentsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetDailyAppointmentsRequest) {
    const { barberId, dateStr } = request;

    // 1. Force local timezone correctly and create start and end of day range (00:00:00 to 23:59:59.999)
    const localDate = parseLocalDate(dateStr);
    const start = startOfDay(localDate);
    const end = endOfDay(localDate);

    // 2. Query repository using converted exact start and end in gte / lte filters
    return await this.appointmentRepository.findByBarberAndDate(barberId, start, end);
  }
}
