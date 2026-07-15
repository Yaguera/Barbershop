import { BarberRepository } from '../domain/repositories/BarberRepository';
import { UserRepository } from '../domain/repositories/UserRepository';

export interface DeleteBarberRequest {
  adminRole: string;
  barberId: string;
}

export class DeleteBarberUseCase {
  constructor(
    private barberRepository: BarberRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: DeleteBarberRequest): Promise<void> {
    const { adminRole, barberId } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem remover barbeiros.');
    }

    const barber = await this.barberRepository.findById(barberId);
    if (!barber) {
      throw new Error('Barbeiro não encontrado.');
    }

    // Soft delete the user associated with this barber
    await this.userRepository.softDelete(barber.userId);
  }
}
