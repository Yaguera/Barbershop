import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { Service } from '@/generated/prisma/client';

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

    if (isNaN(price) || price <= 0) {
      throw new Error('O preço deve ser um valor maior que zero.');
    }

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      throw new Error('A duração em minutos deve ser maior que zero.');
    }

    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      throw new Error('A taxa de comissão deve estar entre 0 e 1 (ex: 0.40 para 40%).');
    }

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
