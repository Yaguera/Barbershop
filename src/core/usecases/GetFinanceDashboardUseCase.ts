import { AppointmentRepository, FinanceReport } from '../domain/repositories/AppointmentRepository';

export interface GetFinanceDashboardRequest {
  adminRole: string; // The role of the requester (must be ADMIN)
}

export class GetFinanceDashboardUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetFinanceDashboardRequest): Promise<FinanceReport> {
    const { adminRole } = request;

    // 1. Verify that the requester is an ADMIN (RF09)
    if (adminRole !== 'ADMIN') {
      throw new Error('Only administrators can access the financial dashboard');
    }

    // 2. Retrieve the finance report
    return await this.appointmentRepository.getFinanceReport();
  }
}
