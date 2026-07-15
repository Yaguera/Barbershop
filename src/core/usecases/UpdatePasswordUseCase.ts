import { UserRepository } from '../domain/repositories/UserRepository';
import bcrypt from 'bcryptjs';

export interface UpdatePasswordRequest {
  userId: string;
  currentPassword?: string;
  newPassword?: string;
}

export class UpdatePasswordUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: UpdatePasswordRequest): Promise<void> {
    const { userId, currentPassword, newPassword } = request;

    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('A nova senha deve possuir pelo menos 6 caracteres.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Se o usuário já tem uma senha definida (não logou só com Google), verificar senha atual
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new Error('A senha atual informada está incorreta');
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new Error('A senha atual informada está incorreta');
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, {
      passwordHash: newHash,
    });
  }
}
