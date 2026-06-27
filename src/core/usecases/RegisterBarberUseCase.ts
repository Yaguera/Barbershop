import { UserRepository } from '../domain/repositories/UserRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { User, Barber } from '@/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

export interface RegisterBarberRequest {
  adminRole: string; // The role of the requester (must be ADMIN)
  name: string;
  email: string;
  passwordHash: string; // The provisional password (clear text, to be hashed)
  workDays: number[];
  workStart: string;
  workEnd: string;
}

export class RegisterBarberUseCase {
  constructor(
    private userRepository: UserRepository,
    private barberRepository: BarberRepository
  ) {}

  async execute(request: RegisterBarberRequest): Promise<{ user: User; barber: Barber }> {
    const { adminRole, name, email, passwordHash, workDays, workStart, workEnd } = request;

    // 1. Verify that the requester is an ADMIN (RF02)
    if (adminRole !== 'ADMIN') {
      throw new Error('Only administrators can register new barbers');
    }

    // 2. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // 3. Hash the provisional password
    const hashedProvPassword = await bcrypt.hash(passwordHash, 10);

    // 4. Create User as BARBER (with a premium default avatar URL)
    const image = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    const user = await this.userRepository.create({
      name,
      email,
      passwordHash: hashedProvPassword,
      role: 'BARBER',
      image,
    });

    // 5. Create Barber profile
    const barber = await this.barberRepository.create({
      userId: user.id,
      workDays,
      workStart,
      workEnd,
    });

    // 6. Simulate email/notification (RN02.2 - log to console)
    console.log('\n--- SIMULAÇÃO DE ENVIO DE E-MAIL (RN02.2) ---');
    console.log(`Para: ${email}`);
    console.log(`Assunto: Bem-vindo à Barbearia - Sua conta foi criada!`);
    console.log(`Olá, ${name}.`);
    console.log(`Você foi registrado como Barbeiro no sistema.`);
    console.log(`Sua senha provisória é: ${passwordHash}`);
    console.log(`Por favor, acesse o sistema e redefina sua senha no seu primeiro login.`);
    console.log('---------------------------------------------\n');

    return { user, barber };
  }
}
