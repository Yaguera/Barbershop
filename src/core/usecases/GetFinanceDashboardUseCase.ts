import { AppointmentRepository, FinanceReport } from '../domain/repositories/AppointmentRepository';

export interface GetFinanceDashboardRequest {
  adminRole: string; // The role of the requester (must be ADMIN)
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
}

export class GetFinanceDashboardUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetFinanceDashboardRequest): Promise<FinanceReport> {
    const { adminRole, period = 'all' } = request;

    // 1. Verify that the requester is an ADMIN (RF09)
    if (adminRole !== 'ADMIN') {
      throw new Error('Only administrators can access the financial dashboard');
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();
    if (period === 'today') {
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
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    // 2. Retrieve the finance report with temporal filters
    return await this.appointmentRepository.getFinanceReport(startDate, endDate);
  }
}
