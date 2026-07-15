'use server';

import { auth } from '@/auth';
import { PrismaUserRepository } from '@/infra/repositories/PrismaUserRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { RegisterBarberUseCase } from '@/core/usecases/RegisterBarberUseCase';
import { GetFinanceDashboardUseCase } from '@/core/usecases/GetFinanceDashboardUseCase';
import { DeleteBarberUseCase } from '@/core/usecases/DeleteBarberUseCase';
import { GetClientManagementDashboardUseCase } from '@/core/usecases/GetClientManagementDashboardUseCase';
import { GetBarberPerformanceUseCase } from '@/core/usecases/GetBarberPerformanceUseCase';
import { GetAdminCalendarMetricsUseCase } from '@/core/usecases/GetAdminCalendarMetricsUseCase';

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

export async function deleteBarberAction(barberId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Apenas administradores podem remover barbeiros.' };
    }

    const userRepo = new PrismaUserRepository();
    const barberRepo = new PrismaBarberRepository();
    const useCase = new DeleteBarberUseCase(barberRepo, userRepo);

    await useCase.execute({
      adminRole: session.user.role,
      barberId,
    });

    return { success: true, message: 'Barbeiro desativado com sucesso.' };
  } catch (error: unknown) {
    console.error('Error deleting barber action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao remover barbeiro.' };
  }
}

export async function getClientManagementAction() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Acesso negado. Apenas administradores.' };
    }

    const userRepo = new PrismaUserRepository();
    const useCase = new GetClientManagementDashboardUseCase(userRepo);

    const clients = await useCase.execute({
      adminRole: session.user.role,
    });

    return { success: true, clients };
  } catch (error: unknown) {
    console.error('Error fetching client management action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar clientes.' };
  }
}

export async function getBarberMetricsAction(
  barberId: string,
  period?: 'day' | 'week' | 'month' | 'all'
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Sessão não autenticada.' };
    }

    // Find if requester is this barber or an admin
    let requesterBarberId: string | null = null;
    if (session.user.role === 'BARBER') {
      const barberRepo = new PrismaBarberRepository();
      const b = await barberRepo.findByUserId(session.user.id);
      requesterBarberId = b ? b.id : null;
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new GetBarberPerformanceUseCase(appointmentRepo);

    const report = await useCase.execute({
      requesterRole: session.user.role,
      requesterBarberId,
      barberId,
      period,
    });

    return { success: true, report };
  } catch (error: unknown) {
    console.error('Error fetching barber metrics action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar métricas do barbeiro.' };
  }
}

export async function getFinanceDashboardAction(period?: 'today' | 'week' | 'month' | 'year' | 'all') {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Acesso negado. Apenas administradores.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new GetFinanceDashboardUseCase(appointmentRepo);

    const report = await useCase.execute({
      adminRole: session.user.role,
      period,
    });

    return { success: true, report };
  } catch (error: unknown) {
    console.error('Error fetching finance dashboard action:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar dados financeiros.' };
  }
}

export async function getBarbersAction(options?: { activeOnly?: boolean }) {
  try {
    const barberRepo = new PrismaBarberRepository();
    const barbers = await barberRepo.findAll(options);

    const formattedBarbers = await Promise.all(
      barbers.map(async (b) => {
        const specialty = await barberRepo.getBarberSpecialty(b.id);
        return {
          id: b.id,
          name: b.user?.name || 'Barbeiro',
          email: b.user?.email || '',
          image: b.user?.image || null,
          workDays: b.workDays,
          workStart: b.workStart,
          workEnd: b.workEnd,
          active: b.user?.active ?? true,
          specialty: specialty || 'Especialista em Cortes & Barba',
        };
      })
    );

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

export async function getAdminCalendarMetricsAction(year: number, month?: number, day?: number) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: 'Não autorizado.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new GetAdminCalendarMetricsUseCase(appointmentRepo);
    const result = await useCase.execute({ year, month, day });

    return { success: true, ...result };
  } catch (error: unknown) {
    console.error('Error fetching admin calendar metrics:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar métricas de calendário.' };
  }
}
