import { AppointmentRepository, CalendarMetric, AdminCalendarDayResult } from '../domain/repositories/AppointmentRepository';

export interface GetAdminCalendarMetricsRequest {
  year: number;
  month?: number;
  day?: number;
}

export interface GetAdminCalendarMetricsResponse {
  metrics: CalendarMetric[];
  dayDetails?: AdminCalendarDayResult;
}

export class GetAdminCalendarMetricsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetAdminCalendarMetricsRequest): Promise<GetAdminCalendarMetricsResponse> {
    const { year, month, day } = request;
    return await this.appointmentRepository.getAdminCalendarMetrics(year, month, day);
  }
}
