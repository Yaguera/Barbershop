'use server';

import { auth } from '@/auth';
import {
  actionSuccess,
  authRequiredResponse,
  forbiddenResponse,
  toStructuredError,
} from '@/core/domain/errors';
import { CreateServiceUseCase } from '@/core/usecases/CreateServiceUseCase';
import { DeleteServiceUseCase } from '@/core/usecases/DeleteServiceUseCase';
import { UpdateServiceUseCase } from '@/core/usecases/UpdateServiceUseCase';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { revalidatePath } from 'next/cache';

export async function getServicesAdminAction(activeOnly: boolean = false) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Acesso negado. Requer permissão de administrador.');
    }

    const serviceRepo = new PrismaServiceRepository();
    const services = await serviceRepo.findAll({ activeOnly });

    return actionSuccess({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        durationMinutes: s.durationMinutes,
        commissionRate: s.commissionRate,
        image: s.image || null,
        active: s.active,
      })),
    });
  } catch (error: unknown) {
    console.error('Erro em getServicesAdminAction:', error);
    return toStructuredError(error, 'Erro ao buscar serviços.');
  }
}

export async function createServiceAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem criar serviços.');
    }

    const name = formData.get('name') as string;
    const priceStr = formData.get('price') as string;
    const durationStr = formData.get('durationMinutes') as string;
    const commissionStr = formData.get('commissionRate') as string;
    const image = (formData.get('image') as string) || null;

    const price = parseFloat(priceStr);
    const durationMinutes = parseInt(durationStr, 10);
    const commissionRate = parseFloat(commissionStr);

    const serviceRepo = new PrismaServiceRepository();
    const useCase = new CreateServiceUseCase(serviceRepo);

    const created = await useCase.execute({
      adminRole: session.user.role,
      name,
      price,
      durationMinutes,
      commissionRate,
      image,
    });

    revalidatePath('/');
    revalidatePath('/admin/servicos');
    revalidatePath('/admin/dashboard');

    return actionSuccess({
      service: {
        id: created.id,
        name: created.name,
        price: created.price,
        durationMinutes: created.durationMinutes,
        commissionRate: created.commissionRate,
        image: created.image || null,
        active: created.active,
      },
    });
  } catch (error: unknown) {
    console.error('Erro em createServiceAction:', error);
    return toStructuredError(error, 'Erro ao criar serviço.');
  }
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem atualizar serviços.');
    }

    const name = formData.has('name') ? (formData.get('name') as string) : undefined;
    const priceStr = formData.has('price') ? (formData.get('price') as string) : undefined;
    const durationStr = formData.has('durationMinutes') ? (formData.get('durationMinutes') as string) : undefined;
    const commissionStr = formData.has('commissionRate') ? (formData.get('commissionRate') as string) : undefined;
    const image = formData.has('image') ? ((formData.get('image') as string) || null) : undefined;
    const activeStr = formData.has('active') ? (formData.get('active') as string) : undefined;

    const price = priceStr !== undefined ? parseFloat(priceStr) : undefined;
    const durationMinutes = durationStr !== undefined ? parseInt(durationStr, 10) : undefined;
    const commissionRate = commissionStr !== undefined ? parseFloat(commissionStr) : undefined;
    const active = activeStr !== undefined ? activeStr === 'true' : undefined;

    const serviceRepo = new PrismaServiceRepository();
    const useCase = new UpdateServiceUseCase(serviceRepo);

    const updated = await useCase.execute({
      adminRole: session.user.role,
      serviceId,
      name,
      price,
      durationMinutes,
      commissionRate,
      image,
      active,
    });

    revalidatePath('/');
    revalidatePath('/admin/servicos');
    revalidatePath('/admin/dashboard');

    return actionSuccess({
      service: {
        id: updated.id,
        name: updated.name,
        price: updated.price,
        durationMinutes: updated.durationMinutes,
        commissionRate: updated.commissionRate,
        image: updated.image || null,
        active: updated.active,
      },
    });
  } catch (error: unknown) {
    console.error('Erro em updateServiceAction:', error);
    return toStructuredError(error, 'Erro ao atualizar serviço.');
  }
}

export async function deleteServiceAction(serviceId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem excluir serviços.');
    }

    const serviceRepo = new PrismaServiceRepository();
    const useCase = new DeleteServiceUseCase(serviceRepo);

    await useCase.execute({
      adminRole: session.user.role,
      serviceId,
    });

    revalidatePath('/');
    revalidatePath('/admin/servicos');
    revalidatePath('/admin/dashboard');

    return actionSuccess({});
  } catch (error: unknown) {
    console.error('Erro em deleteServiceAction:', error);
    return toStructuredError(error, 'Erro ao excluir serviço.');
  }
}
