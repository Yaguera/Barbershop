import { AppointmentRepository, BarberPerformanceReport } from '../domain/repositories/AppointmentRepository';

export interface GetBarberPerformanceRequest {
  requesterRole: string;
  requesterBarberId?: string | null;
  barberId: string;
  period?: 'day' | 'week' | 'month' | 'all';
}

export class GetBarberPerformanceUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetBarberPerformanceRequest): Promise<BarberPerformanceReport> {
    const { requesterRole, requesterBarberId, barberId, period = 'month' } = request;

    if (requesterRole !== 'ADMIN' && (requesterRole !== 'BARBER' || requesterBarberId !== barberId)) {
      throw new Error('Sem permissão para visualizar métricas deste barbeiro.');
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();
    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diffToSunday = now.getDate() - dayOfWeek;
      startDate = new Date(now.getFullYear(), now.getMonth(), diffToSunday, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), diffToSunday + 6, 23, 59, 59);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return await this.appointmentRepository.getBarberPerformanceReport(barberId, startDate, endDate);
  }
}
