'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '@/infra/repositories/PrismaUserRepository';
import { auth } from '@/auth';

// Zod Schema to validate and sanitize sign-up payload (RN01.2)
const signUpSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.any().optional(), // Receive and ignore/sanitize the role field
});

export async function signUpAction(prevState: unknown, formData: FormData) {
  try {
    const rawName = formData.get('name');
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawRole = formData.get('role'); // Simulate an attacker sending a role payload

    // 1. Zod Validation and Sanitization (RN01.2)
    const payload = signUpSchema.parse({
      name: rawName,
      email: rawEmail,
      password: rawPassword,
      role: rawRole,
    });

    // Sanitization: We completely discard the 'role' field from payload and force 'CLIENT'
    const { name, email, password } = payload;

    const userRepository = new PrismaUserRepository();

    // 2. Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create User as CLIENT (Security Sanitization and premium default avatar)
    const image = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(name)}`;
    await userRepository.create({
      name,
      email,
      passwordHash,
      role: 'CLIENT', // Always default to CLIENT, never allow ADMIN creation organically (RF01)
      image,
    });

    return { success: true, message: 'Cadastro realizado com sucesso!' };
  } catch (error: unknown) {
    console.error('Sign up action error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'Erro interno no servidor.',
    };
  }
}

// Zod Schema to validate and sanitize update profile payload
const updateProfileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  image: z.string().url('URL da foto inválida').or(z.literal('')).optional().nullable(),
  phone: z.string().regex(/^\+55 \d{2} \d{5}-\d{4}$/, 'O número de telefone deve estar no formato +55 DD XXXXX-XXXX').or(z.literal('')).optional().nullable(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').or(z.literal('')).optional().nullable(),
});

export async function updateProfileAction(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Você precisa estar logado para editar o perfil.' };
    }

    const userId = session.user.id;
    const rawName = formData.get('name');
    const rawEmail = formData.get('email');
    const rawImage = formData.get('image');
    const rawPhone = formData.get('phone');
    const rawPassword = formData.get('password');

    // Zod Validation and Sanitization
    const payload = updateProfileSchema.parse({
      name: rawName,
      email: rawEmail,
      image: rawImage,
      phone: rawPhone,
      password: rawPassword,
    });

    const userRepository = new PrismaUserRepository();

    // Check if email is in use by another user
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: 'Este e-mail já está sendo utilizado por outra conta.' };
    }

    const updateData: {
      name: string;
      email: string;
      image: string | null;
      phone: string | null;
      passwordHash?: string;
    } = {
      name: payload.name,
      email: payload.email,
      image: payload.image || null,
      phone: payload.phone || null,
    };

    // Hash password if updating
    if (payload.password) {
      updateData.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const updatedUser = await userRepository.update(userId, updateData);

    return {
      success: true,
      message: 'Perfil atualizado com sucesso!',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        phone: updatedUser.phone,
      },
    };
  } catch (error: unknown) {
    console.error('Update profile action error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'Erro interno no servidor.',
    };
  }
}
