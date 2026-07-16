import { AppointmentRepository, AdminDashboardMetricsReport } from '../domain/repositories/AppointmentRepository';

export interface GetAdminDashboardMetricsRequest {
  requesterRole: string;
  startDate: Date;
  endDate: Date;
  barberId?: string;
}

export class GetAdminDashboardMetricsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: GetAdminDashboardMetricsRequest): Promise<AdminDashboardMetricsReport> {
    const { requesterRole, startDate, endDate, barberId } = request;

    if (requesterRole !== 'ADMIN') {
      throw new Error('Acesso negado. Apenas administradores podem acessar o painel analítico de alta densidade.');
    }

    if (startDate >= endDate) {
      throw new Error('A data inicial deve ser anterior à data final.');
    }

    return await this.appointmentRepository.getAdminDashboardMetrics(startDate, endDate, barberId);
  }
}
