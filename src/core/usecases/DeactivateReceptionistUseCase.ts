import { ReceptionistRepository } from '../domain/repositories/ReceptionistRepository';

export interface DeactivateReceptionistRequest {
  adminRole: string;
  receptionistId: string;
}

export class DeactivateReceptionistUseCase {
  constructor(private receptionistRepository: ReceptionistRepository) {}

  async execute(request: DeactivateReceptionistRequest): Promise<void> {
    const { adminRole, receptionistId } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem desativar atendentes.');
    }

    const receptionist = await this.receptionistRepository.findById(receptionistId);
    if (!receptionist) {
      throw new Error('Atendente não encontrada.');
    }

    // Soft delete o usuário vinculado, incrementando sessionVersion para revogar sessões ativas
    await this.receptionistRepository.softDelete(receptionist.userId);
  }
}
