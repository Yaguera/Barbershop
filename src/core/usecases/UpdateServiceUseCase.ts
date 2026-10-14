import { ValidationError } from '../domain/errors';
import { Service } from '@/core/domain/models';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';

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
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('O preço deve ser um valor maior que zero.');
      }
      dataToUpdate.price = price;
    }

    if (durationMinutes !== undefined) {
      if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        throw new Error('A duração em minutos deve ser maior que zero.');
      }
      dataToUpdate.durationMinutes = durationMinutes;
    }

    if (commissionRate !== undefined) {
      if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
        throw new ValidationError('A taxa de comissão deve estar entre 0 e 1 (ex: 0.40 para 40%).');
      }
      if (Math.abs(commissionRate * 10000 - Math.round(commissionRate * 10000)) > 1e-7) throw new ValidationError('A comissão aceita até duas casas decimais em percentual.');
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
