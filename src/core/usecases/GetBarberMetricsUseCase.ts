import { AppointmentRepository, BarberDetailedMetricsReport } from '../domain/repositories/AppointmentRepository';

export interface GetBarberMetricsRequest {
  barberId: string;
  period?: 'day' | 'week' | 'month' | 'all';
}

export class GetBarberMetricsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetBarberMetricsRequest): Promise<BarberDetailedMetricsReport> {
    const { barberId, period = 'month' } = request;

    if (!barberId) {
      throw new Error('ID do barbeiro é obrigatório para acessar métricas.');
    }

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diffToSunday = now.getDate() - dayOfWeek;
      startDate = new Date(now.getFullYear(), now.getMonth(), diffToSunday, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), diffToSunday + 6, 23, 59, 59, 999);
    } else if (period === 'all') {
      startDate = new Date(2024, 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
    } else {
      // default: month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return await this.appointmentRepository.getBarberDetailedMetrics(barberId, startDate, endDate);
  }
}
