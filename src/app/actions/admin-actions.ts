'use server';

import { auth } from '@/auth';
import { PrismaUserRepository } from '@/infra/repositories/PrismaUserRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { RegisterBarberUseCase } from '@/core/usecases/RegisterBarberUseCase';
import { GetFinanceDashboardUseCase } from '@/core/usecases/GetFinanceDashboardUseCase';

export async function registerBarberAction(data: {
  name: string;
  email: string;
  passwordHash: string; // clear text temporary password
  workDays: number[];
  workStart: string;
  workEnd: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Apenas administradores podem registrar barbeiros.' };
    }

    const userRepo = new PrismaUserRepository();
    const barberRepo = new PrismaBarberRepository();
    const useCase = new RegisterBarberUseCase(userRepo, barberRepo);

    const result = await useCase.execute({
      adminRole: session.user.role,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      workDays: data.workDays,
      workStart: data.workStart,
      workEnd: data.workEnd,
    });

    return {
      success: true,
      message: 'Barbeiro registrado com sucesso! A senha provisória foi registrada no console.',
      barber: result.barber,
    };
  } catch (error: unknown) {
    console.error('Error registering barber action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao registrar barbeiro.' };
  }
}

export async function getFinanceDashboardAction() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Acesso negado. Apenas administradores.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new GetFinanceDashboardUseCase(appointmentRepo);

    const report = await useCase.execute({
      adminRole: session.user.role,
    });

    return { success: true, report };
  } catch (error: unknown) {
    console.error('Error fetching finance dashboard action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar dados financeiros.' };
  }
}

export async function getBarbersAction() {
  try {
    const barberRepo = new PrismaBarberRepository();
    const barbers = await barberRepo.findAll();

    const formattedBarbers = barbers.map((b) => ({
      id: b.id,
      name: b.user?.name || 'Barbeiro',
      email: b.user?.email || '',
      image: b.user?.image || null,
      workDays: b.workDays,
      workStart: b.workStart,
      workEnd: b.workEnd,
    }));

    return { success: true, barbers: formattedBarbers };
  } catch (error: unknown) {
    console.error('Error fetching barbers action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar barbeiros.' };
  }
}

export async function getServicesAction() {
  try {
    const serviceRepo = new PrismaServiceRepository();
    const services = await serviceRepo.findAll();
    return { success: true, services };
  } catch (error: unknown) {
    console.error('Error fetching services action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar serviços.' };
  }
}
