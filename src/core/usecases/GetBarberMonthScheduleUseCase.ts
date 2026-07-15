import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';

export interface GetBarberMonthScheduleRequest {
  barberId: string;
  year: number;
  month: number;
}

export interface BarberDayOccupancy {
  date: string; // YYYY-MM-DD
  count: number;
}

export class GetBarberMonthScheduleUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetBarberMonthScheduleRequest): Promise<BarberDayOccupancy[]> {
    const { barberId, year, month } = request;
    if (!barberId) {
      throw new Error('Barber ID is required');
    }
    return await this.appointmentRepository.getBarberMonthOccupancy(barberId, year, month);
  }
}
