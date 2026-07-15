import { UserRepository, ClientSummary } from '../domain/repositories/UserRepository';

export interface GetClientManagementRequest {
  adminRole: string;
}

export class GetClientManagementDashboardUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetClientManagementRequest): Promise<ClientSummary[]> {
    const { adminRole } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem acessar a gestão de clientes.');
    }

    return await this.userRepository.getClientSummaries();
  }
}
