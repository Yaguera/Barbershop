import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';

export interface UpdateServiceRequest {
  adminRole: string;
  serviceId: string;
  name?: string;
  price?: number;
  durationMinutes?: number;
  commissionRate?: number;
  image?: string | null;
  active?: boolean;
}

export class UpdateServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(request: UpdateServiceRequest): Promise<Service> {
    const { adminRole, serviceId, name, price, durationMinutes, commissionRate, image, active } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem atualizar serviços.');
    }

    const existing = await this.serviceRepository.findById(serviceId);
    if (!existing) {
      throw new Error('Serviço não encontrado.');
    }

    const dataToUpdate: Partial<{
      name: string;
      price: number;
      durationMinutes: number;
      commissionRate: number;
      image?: string | null;
      active?: boolean;
    }> = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new Error('O nome do serviço não pode ser vazio.');
      }
      dataToUpdate.name = name.trim();
    }

    if (price !== undefined) {
      if (isNaN(price) || price <= 0) {
        throw new Error('O preço deve ser um valor maior que zero.');
      }
      dataToUpdate.price = price;
    }

    if (durationMinutes !== undefined) {
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new Error('A duração em minutos deve ser maior que zero.');
      }
      dataToUpdate.durationMinutes = durationMinutes;
    }

    if (commissionRate !== undefined) {
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
        throw new Error('A taxa de comissão deve estar entre 0 e 1 (ex: 0.40 para 40%).');
      }
      dataToUpdate.commissionRate = commissionRate;
    }

    if (image !== undefined) {
      dataToUpdate.image = image;
    }

    if (active !== undefined) {
      dataToUpdate.active = active;
    }

    return await this.serviceRepository.update(serviceId, dataToUpdate);
  }
}
