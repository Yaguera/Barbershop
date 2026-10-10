import { reportPeriod } from '../utils/report-period';
import { AppointmentReportRepository,BarberDetailedMetricsReport } from '../domain/repositories/AppointmentReportRepository';

export interface GetBarberMetricsRequest {
  barberId: string;
  period?: 'today' | 'day' | 'week' | 'month' | 'year' | 'all';
}

export class GetBarberMetricsUseCase {
  constructor(private appointmentRepository: AppointmentReportRepository) {}

  async execute(request: GetBarberMetricsRequest): Promise<BarberDetailedMetricsReport> {
    const { barberId, period = 'month' } = request;

    if (!barberId) {
      throw new Error('ID do barbeiro é obrigatório para acessar métricas.');
    }

    const { startDate, endDate } = reportPeriod(period);

    return await this.appointmentRepository.getBarberDetailedMetrics(barberId, startDate, endDate);
  }
}
