import { AppointmentReportRepository, BarberPerformanceReport } from '../domain/repositories/AppointmentReportRepository';
import { reportPeriod } from '../utils/report-period';

export interface GetBarberPerformanceRequest {
  requesterRole: string;
  requesterBarberId?: string | null;
  barberId: string;
  period?: 'today' | 'day' | 'week' | 'month' | 'year' | 'all';
}

export class GetBarberPerformanceUseCase {
  constructor(private appointmentRepository: AppointmentReportRepository) {}

  async execute(request: GetBarberPerformanceRequest): Promise<BarberPerformanceReport> {
    const { requesterRole, requesterBarberId, barberId, period = 'month' } = request;

    if (requesterRole !== 'ADMIN' && (requesterRole !== 'BARBER' || requesterBarberId !== barberId)) {
      throw new Error('Sem permissão para visualizar métricas deste barbeiro.');
    }

    const { startDate, endDate } = reportPeriod(period);

    return await this.appointmentRepository.getBarberPerformanceReport(
      barberId,
      period === 'all' ? undefined : startDate,
      period === 'all' ? undefined : endDate
    );
  }
}
