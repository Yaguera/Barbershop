import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';

export interface DeleteServiceRequest {
  adminRole: string;
  serviceId: string;
}

export class DeleteServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(request: DeleteServiceRequest): Promise<Service> {
    const { adminRole, serviceId } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem excluir serviços.');
    }

    const existing = await this.serviceRepository.findById(serviceId);
    if (!existing) {
      throw new Error('Serviço não encontrado.');
    }

    // Soft delete: set active = false instead of hard deleting to preserve financial/appointment history
    return await this.serviceRepository.update(serviceId, {
      active: false,
    });
  }
}
