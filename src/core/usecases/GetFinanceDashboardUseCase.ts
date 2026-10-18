import { ForbiddenError } from '../domain/errors';
import { AppointmentReportRepository, FinanceReport } from '../domain/repositories/AppointmentReportRepository';
import { reportPeriod } from '../utils/report-period';

export interface GetFinanceDashboardRequest {
  adminRole: string; // The role of the requester (must be ADMIN)
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
}

export class GetFinanceDashboardUseCase {
  constructor(private appointmentRepository: AppointmentReportRepository) {}

  async execute(request: GetFinanceDashboardRequest): Promise<FinanceReport> {
    const { adminRole, period = 'all' } = request;

    // 1. Verify that the requester is an ADMIN (RF09)
    if (adminRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can access the financial dashboard');
    }

    if (period === 'all') {
      return await this.appointmentRepository.getFinanceReport(undefined, undefined);
    }

    const { startDate, endDate } = reportPeriod(period);

    // 2. Retrieve the finance report with temporal filters in America/Sao_Paulo business calendar
    return await this.appointmentRepository.getFinanceReport(startDate, endDate);
  }
}
