import { ValidationError } from '../domain/errors';
import { Service } from '@/core/domain/models';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';

export interface CreateServiceRequest {
  adminRole: string;
  name: string;
  price: number;
  durationMinutes: number;
  commissionRate: number;
  image?: string | null;
}

export class CreateServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(request: CreateServiceRequest): Promise<Service> {
    const { adminRole, name, price, durationMinutes, commissionRate, image } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem cadastrar serviços.');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('O nome do serviço é obrigatório.');
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('O preço deve ser um valor maior que zero.');
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new Error('A duração em minutos deve ser maior que zero.');
    }

    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      throw new ValidationError('A taxa de comissão deve estar entre 0 e 1 (ex: 0.40 para 40%).');
    }

    if (Math.abs(commissionRate * 10000 - Math.round(commissionRate * 10000)) > 1e-7) throw new ValidationError('A comissão aceita até duas casas decimais em percentual.');

    return await this.serviceRepository.create({
      name: name.trim(),
      price,
      durationMinutes,
      commissionRate,
      image: image || null,
      active: true,
    });
  }
}
