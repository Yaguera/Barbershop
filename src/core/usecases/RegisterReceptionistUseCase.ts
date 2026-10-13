import { Receptionist, User } from '@/core/domain/models';
import * as bcrypt from 'bcryptjs';
import { ReceptionistRepository } from '../domain/repositories/ReceptionistRepository';
import { UserRepository } from '../domain/repositories/UserRepository';

export interface RegisterReceptionistRequest {
  adminRole: string;
  name: string;
  email: string;
  passwordHash: string; // senha provisória em texto claro para hash
}

export class RegisterReceptionistUseCase {
  constructor(
    private userRepository: UserRepository,
    private receptionistRepository: ReceptionistRepository
  ) {}

  async execute(request: RegisterReceptionistRequest): Promise<{ user: User; receptionist: Receptionist }> {
    const { adminRole, name, email, passwordHash } = request;

    if (adminRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem cadastrar atendentes.');
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Nome da atendente é obrigatório (mínimo de 2 caracteres).');
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('E-mail válido é obrigatório.');
    }

    if (!passwordHash || passwordHash.length < 6) {
      throw new Error('A senha provisória deve ter no mínimo 6 caracteres.');
    }

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const hashedProvPassword = await bcrypt.hash(passwordHash, 10);
    const image = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(trimmedName)}`;

    const user = await this.userRepository.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash: hashedProvPassword,
      role: 'RECEPTIONIST',
      image,
    });

    const receptionist = await this.receptionistRepository.create(user.id);

    return { user, receptionist };
  }
}
