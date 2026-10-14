'use server';
import type { CalendarFilters } from '@/core/domain/repositories/AdminCalendarRepository';
import { reportPeriod } from '@/core/utils/report-period';
import { PrismaAppointmentReportRepository } from '@/infra/repositories/PrismaAppointmentReportRepository';

import { auth } from '@/auth';
import { DeleteBarberUseCase } from '@/core/usecases/DeleteBarberUseCase';
import { GetAdminCalendarMetricsUseCase } from '@/core/usecases/GetAdminCalendarMetricsUseCase';
import { GetAdminDashboardMetricsUseCase } from '@/core/usecases/GetAdminDashboardMetricsUseCase';
import { GetBarberPerformanceUseCase } from '@/core/usecases/GetBarberPerformanceUseCase';
import { GetClientManagementDashboardUseCase } from '@/core/usecases/GetClientManagementDashboardUseCase';
import { GetFinanceDashboardUseCase } from '@/core/usecases/GetFinanceDashboardUseCase';
import { RegisterBarberUseCase } from '@/core/usecases/RegisterBarberUseCase';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaPaymentReceiptRepository } from '@/infra/repositories/PrismaPaymentReceiptRepository';
import { PrismaReceptionistRepository } from '@/infra/repositories/PrismaReceptionistRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { PrismaUserRepository } from '@/infra/repositories/PrismaUserRepository';
import { DeactivateReceptionistUseCase } from '@/core/usecases/DeactivateReceptionistUseCase';
import { RegisterReceptionistUseCase } from '@/core/usecases/RegisterReceptionistUseCase';
import { RevertPaymentReceiptUseCase } from '@/core/usecases/RevertPaymentReceiptUseCase';
import {
  AppError,
  internalErrorResponse,
  actionSuccess,
  authRequiredResponse,
  forbiddenResponse,
  notFoundResponse,
  toStructuredError,
} from '@/core/domain/errors';
import { revalidatePath } from 'next/cache';

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
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem registrar barbeiros.');
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

    return actionSuccess({
      message: 'Barbeiro registrado com sucesso! Compartilhe a senha provisória diretamente com o profissional.',
      barber: result.barber,
    });
  } catch (error: unknown) {
    console.error('Error registering barber action:', error);
    return toStructuredError(error, 'Erro ao registrar barbeiro.');
  }
}

export async function deleteBarberAction(barberId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem remover barbeiros.');
    }

    const userRepo = new PrismaUserRepository();
    const barberRepo = new PrismaBarberRepository();
    const useCase = new DeleteBarberUseCase(barberRepo, userRepo);

    await useCase.execute({
      adminRole: session.user.role,
      barberId,
    });

    return actionSuccess({ message: 'Barbeiro desativado com sucesso.' });
  } catch (error: unknown) {
    console.error('Error deleting barber action:', error);
    return toStructuredError(error, 'Erro ao remover barbeiro.');
  }
}

export async function getClientManagementAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Acesso negado. Apenas administradores.');
    }

    const userRepo = new PrismaUserRepository();
    const useCase = new GetClientManagementDashboardUseCase(userRepo);

    const clients = await useCase.execute({
      adminRole: session.user.role,
    });

    return actionSuccess({ clients });
  } catch (error: unknown) {
    console.error('Error fetching client management action:', error);
    return toStructuredError(error, 'Erro ao carregar clientes.');
  }
}

export async function getBarberMetricsAction(
  barberId?: string,
  period?: 'day' | 'week' | 'month' | 'all'
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse('Sessão não autenticada.');
    }

    // Find if requester is this barber or an admin
    let requesterBarberId: string | null = null;
    if (session.user.role === 'BARBER') {
      const barberRepo = new PrismaBarberRepository();
      const b = await barberRepo.findByUserId(session.user.id);
      requesterBarberId = b ? b.id : null;
    }

    const targetBarberId = barberId || requesterBarberId;
    if (!targetBarberId) {
      return notFoundResponse('Perfil de barbeiro não encontrado para este usuário.');
    }

    const useCase = new GetBarberPerformanceUseCase(new PrismaAppointmentReportRepository());

    const report = await useCase.execute({
      requesterRole: session.user.role,
      requesterBarberId,
      barberId: targetBarberId,
      period,
    });

    return actionSuccess({ report });
  } catch (error: unknown) {
    console.error('Error fetching barber metrics action:', error);
    return toStructuredError(error, 'Erro ao buscar métricas do barbeiro.');
  }
}

export async function getFinanceDashboardAction(period?: 'today' | 'week' | 'month' | 'year' | 'all') {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Acesso negado. Apenas administradores.');
    }

    const useCase = new GetFinanceDashboardUseCase(new PrismaAppointmentReportRepository());

    const report = await useCase.execute({
      adminRole: session.user.role,
      period,
    });

    return actionSuccess({ report });
  } catch (error: unknown) {
    console.error('Error fetching finance dashboard action:', error);
    return toStructuredError(error, 'Erro ao carregar dados financeiros.');
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

    return actionSuccess({ barbers: formattedBarbers });
  } catch (error: unknown) {
    console.error('Error fetching barbers action:', error);
    return toStructuredError(error, 'Erro ao buscar barbeiros.');
  }
}

export async function getServicesAction() {
  try {
    const serviceRepo = new PrismaServiceRepository();
    const services = await serviceRepo.findAll();
    return actionSuccess({ services });
  } catch (error: unknown) {
    console.error('Error fetching services action:', error);
    return toStructuredError(error, 'Erro ao buscar serviços.');
  }
}

export async function getAdminDashboardAnalyticsAction(
  period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' = 'month',
  barberId?: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Acesso negado. Apenas administradores.');
    }

    const { startDate, endDate } = reportPeriod(period);

    const useCase = new GetAdminDashboardMetricsUseCase(new PrismaAppointmentReportRepository());

    const report = await useCase.execute({
      requesterRole: session.user.role,
      startDate,
      endDate,
      barberId: barberId === 'all' ? undefined : barberId,
    });

    return actionSuccess({ report });
  } catch (error: unknown) {
    console.error('Error in getAdminDashboardAnalyticsAction:', error);
    return toStructuredError(error, 'Erro ao carregar dados analíticos do dashboard.');
  }
}


export async function getAdminCalendarMetricsAction(year: number, month?: number, day?: number, filters: CalendarFilters = {}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem acessar métricas de calendário.');
    }

    const useCase = new GetAdminCalendarMetricsUseCase(new PrismaAppointmentReportRepository());
    const result = await useCase.execute({ year, month, day, filters, adminRole: session.user.role });

    return actionSuccess({ calendar: result });
  } catch (error: unknown) {
    console.error('Error fetching admin calendar metrics:', error);
    return error instanceof AppError ? toStructuredError(error) : internalErrorResponse('Não foi possível carregar o calendário. Tente novamente.');
  }
}

export async function getReceptionistsAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Acesso negado. Apenas administradores.');
    }

    const receptionistRepo = new PrismaReceptionistRepository();
    const list = await receptionistRepo.findAll();

    return actionSuccess({
      receptionists: list.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.user.name || 'Atendente',
        email: r.user.email,
        active: r.user.active,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching receptionists:', error);
    return toStructuredError(error, 'Erro ao carregar atendentes.');
  }
}

export async function registerReceptionistAction(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem cadastrar atendentes.');
    }

    const userRepo = new PrismaUserRepository();
    const receptionistRepo = new PrismaReceptionistRepository();
    const useCase = new RegisterReceptionistUseCase(userRepo, receptionistRepo);

    const result = await useCase.execute({
      adminRole: session.user.role,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
    });

    revalidatePath('/admin/atendentes');

    return actionSuccess({
      message: 'Atendente cadastrada com sucesso! Compartilhe a senha provisória de forma segura.',
      receptionist: result.receptionist,
    });
  } catch (error: unknown) {
    console.error('Error registering receptionist:', error);
    return toStructuredError(error, 'Erro ao cadastrar atendente.');
  }
}

export async function deactivateReceptionistAction(receptionistId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem desativar atendentes.');
    }

    const receptionistRepo = new PrismaReceptionistRepository();
    const useCase = new DeactivateReceptionistUseCase(receptionistRepo);

    await useCase.execute({
      adminRole: session.user.role,
      receptionistId,
    });

    revalidatePath('/admin/atendentes');

    return actionSuccess({
      message: 'Atendente desativada com sucesso. Sessões ativas foram revogadas.',
    });
  } catch (error: unknown) {
    console.error('Error deactivating receptionist:', error);
    return toStructuredError(error, 'Erro ao desativar atendente.');
  }
}

export async function revertPaymentReceiptAction(receiptId: string, reason: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas administradores podem reverter recebimentos.');
    }

    const receiptRepo = new PrismaPaymentReceiptRepository();
    const useCase = new RevertPaymentReceiptUseCase(receiptRepo);

    await useCase.execute({
      receiptId,
      reason,
      operatorUserId: session.user.id,
      operatorRole: session.user.role,
    });

    revalidatePath('/atendente/caixa');
    revalidatePath('/admin/dashboard');

    return actionSuccess({
      message: 'Recebimento revertido com sucesso para conferência e auditoria.',
    });
  } catch (error: unknown) {
    console.error('Error reverting payment receipt:', error);
    return toStructuredError(error, 'Erro ao reverter recebimento.');
  }
}
