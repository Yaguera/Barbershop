'use server';
import { PrismaAppointmentReportRepository } from '@/infra/repositories/PrismaAppointmentReportRepository';

import { auth } from '@/auth';
import { ChangeAppointmentStatusUseCase } from '@/core/usecases/ChangeAppointmentStatusUseCase';
import { CreateAppointmentUseCase } from '@/core/usecases/CreateAppointmentUseCase';
import { GetBarberMetricsUseCase } from '@/core/usecases/GetBarberMetricsUseCase';
import { GetBarberMonthScheduleUseCase } from '@/core/usecases/GetBarberMonthScheduleUseCase';
import { RescheduleAppointmentUseCase } from '@/core/usecases/RescheduleAppointmentUseCase';
import {
  actionSuccess,
  authRequiredResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  toStructuredError,
  validationResponse,
} from '@/core/domain/errors';
import { parseLocalDate } from '@/core/utils/date-utils';
import { prisma } from '@/infra/db/prisma-client';
import { barberAppointments, clientAppointments } from '@/infra/repositories/appointment-queries';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { revalidatePath } from 'next/cache';

// Action to create a new appointment (RF03/RF04)
export async function createAppointmentAction(data: {
  barberId: string;
  serviceId: string;
  startTimeStr: string; // ISO string
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse('Você precisa estar logado para agendar.');
    }

    const { barberId, serviceId, startTimeStr } = data;
    const startTime = new Date(startTimeStr);

    if (isNaN(startTime.getTime())) {
      return validationResponse('Data/Hora de início inválida.');
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();
    const barberRepo = new PrismaBarberRepository();

    const useCase = new CreateAppointmentUseCase(
      appointmentRepo,
      serviceRepo,
      barberRepo
    );

    const appointment = await useCase.execute({
      clientId: session.user.id,
      barberId,
      serviceId,
      startTime,
    });

    if (appointment) {
      try {
        const barberRecord = await prisma.barber.findUnique({
          where: { id: barberId },
          select: { userId: true, user: { select: { name: true } } },
        });

        const serviceRecord = await prisma.service.findUnique({
          where: { id: serviceId },
          select: { name: true },
        });

        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(startTime);

        if (barberRecord?.userId) {
          await prisma.notification.create({
            data: {
              userId: barberRecord.userId,
              title: 'Novo agendamento',
              message: `${session.user.name || 'Cliente'} agendou ${serviceRecord?.name || 'serviço'} para ${formattedDate}.`,
              type: 'INFO',
              read: false,
            },
          });
        }

        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: 'Agendamento confirmado',
            message: `Seu agendamento de ${serviceRecord?.name || 'serviço'} com ${barberRecord?.user?.name || 'o barbeiro'} foi confirmado para ${formattedDate}.`,
            type: 'INFO',
            read: false,
          },
        });
      } catch (notifError) {
        console.error('Erro ao registrar notificações de agendamento:', notifError);
      }

      revalidatePath('/barber/agenda');
      revalidatePath('/barber/dashboard');
      revalidatePath('/agenda');
      revalidatePath('/');
    }

    return actionSuccess({ appointment });
  } catch (error: unknown) {
    console.error('Error creating appointment:', error);
    return toStructuredError(error, 'Erro ao criar agendamento.');
  }
}

// Action to change appointment status (RF07/RF08)
export async function changeAppointmentStatusAction(data: {
  appointmentId: string;
  newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }

    const { appointmentId, newStatus } = data;
    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new ChangeAppointmentStatusUseCase(appointmentRepo, new PrismaBarberRepository());

    await useCase.execute({
      appointmentId,
      newStatus,
      userId: session.user.id,
      userRole: session.user.role as 'ADMIN' | 'BARBER' | 'CLIENT',
    });

    revalidatePath('/barber/agenda');
    revalidatePath('/barber/dashboard');
    revalidatePath('/agenda');

    return actionSuccess({ message: 'Status atualizado com sucesso!' });
  } catch (error: unknown) {
    console.error('Error updating appointment status:', error);
    return toStructuredError(error, 'Erro ao atualizar status.');
  }
}

// Action to retrieve appointments for the current client
export async function getClientAppointmentsAction(page = 1, upcomingOnly = false) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }

    if (!Number.isInteger(page) || page < 1 || page > 10000) {
      return validationResponse('Página inválida.');
    }
    const result = await clientAppointments(session.user.id, page, upcomingOnly);
    return actionSuccess({ ...result });
  } catch (error: unknown) {
    console.error('Error fetching client appointments:', error);
    return toStructuredError(error, 'Erro ao buscar agendamentos.');
  }
}

// Action to retrieve appointments for the current barber's queue (RF07/RF08)
export async function getBarberAppointmentsAction(dateStr?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return authRequiredResponse();
    }

    if (session.user.role !== 'BARBER' && session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas barbeiros e administradores podem acessar esta agenda.');
    }

    const barberRepo = new PrismaBarberRepository();

    // 1. Find Barber profile linked to current user
    let barberId = '';
    if (session.user.role === 'BARBER') {
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return notFoundResponse('Perfil de barbeiro não encontrado.');
      }
      barberId = barber.id;
    } else {
      // If Admin, they can view the first barber or we let them pass a barberId (we can fallback)
      const barbers = await barberRepo.findAll();
      if (barbers.length === 0) {
        return actionSuccess({ appointments: [], barberId: '' });
      }
      barberId = barbers[0].id;
    }

    const appointments = await barberAppointments(barberId, parseLocalDate(dateStr));
    return actionSuccess({ appointments, barberId });
  } catch (error: unknown) {
    console.error('Error fetching barber appointments:', error);
    return toStructuredError(error, 'Erro ao buscar agendamentos.');
  }
}

export async function getBarberMonthScheduleAction(year: number, month: number, barberIdParam?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return authRequiredResponse();
    }

    if (!['ADMIN', 'BARBER'].includes(session.user.role)) {
      return forbiddenResponse();
    }
    if (session.user.role === 'BARBER' && barberIdParam) {
      const ownBarber = await new PrismaBarberRepository().findByUserId(session.user.id);
      if (ownBarber?.id !== barberIdParam) return forbiddenResponse('Acesso negado à agenda de outro profissional.');
    }
    let barberId = barberIdParam;
    if (!barberId) {
      const barberRepo = new PrismaBarberRepository();
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return notFoundResponse('Perfil de barbeiro não encontrado.');
      }
      barberId = barber.id;
    }

    const useCase = new GetBarberMonthScheduleUseCase(new PrismaAppointmentReportRepository());
    const occupancy = await useCase.execute({ barberId, year, month });

    return actionSuccess({ occupancy, barberId });
  } catch (error: unknown) {
    console.error('Error fetching barber month schedule:', error);
    return toStructuredError(error, 'Erro ao buscar agenda do mês.');
  }
}

export async function getBarberMetricsDetailedAction(
  period: 'today' | 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  barberIdParam?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return authRequiredResponse();
    }
    if (session.user.role !== 'BARBER' && session.user.role !== 'ADMIN') {
      return forbiddenResponse('Apenas barbeiros e administradores podem acessar estas métricas.');
    }

    const barberRepo = new PrismaBarberRepository();
    let barberId = '';
    if (session.user.role === 'ADMIN' && barberIdParam) {
      barberId = barberIdParam;
    } else if (session.user.role === 'BARBER') {
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return notFoundResponse('Perfil profissional do barbeiro não encontrado.');
      }
      barberId = barber.id;
    } else {
      const barbers = await barberRepo.findAll();
      if (barbers.length === 0) {
        return actionSuccess({ report: null, barberId: '', barber: null });
      }
      barberId = barbers[0].id;
    }

    const barber = await barberRepo.findById(barberId);
    const specialty = barber ? await barberRepo.getBarberSpecialty(barber.id) : null;

    const useCase = new GetBarberMetricsUseCase(new PrismaAppointmentReportRepository());
    const report = await useCase.execute({ barberId, period });

    return actionSuccess({
      report,
      barberId,
      barber: barber
        ? {
            id: barber.id,
            name: barber.user?.name || 'Barbeiro Profissional',
            email: barber.user?.email || '',
            image: barber.user?.image || null,
            specialty: specialty || 'Especialista em Cortes & Barba',
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('Error fetching detailed barber metrics:', error);
    return toStructuredError(error, 'Erro ao buscar métricas detalhadas do barbeiro.');
  }
}

export async function getAppointmentDetailsAction(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return authRequiredResponse();
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const barberRepo = new PrismaBarberRepository();

    const appointment = await appointmentRepo.findByIdWithRelations(appointmentId);
    if (!appointment) {
      return notFoundResponse('Agendamento não encontrado.');
    }

    const ownBarber = session.user.role === 'BARBER' ? await barberRepo.findByUserId(session.user.id) : null;
    // Ownership check: If not admin, not own barber, and not client, return 404 to avoid leaking existence
    if (
      session.user.role !== 'ADMIN' &&
      ownBarber?.id !== appointment.barberId &&
      appointment.clientId !== session.user.id
    ) {
      return notFoundResponse('Agendamento não encontrado.');
    }

    const barber = await barberRepo.findById(appointment.barberId);
    const specialty = barber ? await barberRepo.getBarberSpecialty(barber.id) : null;

    return actionSuccess({
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        clientId: appointment.clientId,
        barberId: appointment.barberId,
        serviceId: appointment.serviceId,
        serviceName: appointment.service?.name || 'Serviço',
        servicePrice: appointment.priceCents / 100,
        serviceDurationMinutes: appointment.service?.durationMinutes || 30,
        barberName: barber?.user?.name || 'Barbeiro Profissional',
        barberSpecialty: specialty,
        barberImage: barber?.user?.image || null,
        clientName: appointment.client?.name || 'Cliente VIP',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching appointment details:', error);
    return toStructuredError(error, 'Erro ao carregar detalhes.');
  }
}

export async function cancelAppointmentByClientAction(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return authRequiredResponse('Você precisa estar logado.');
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const existing = await appointmentRepo.findById(appointmentId);
    if (!existing || existing.clientId !== session.user.id) {
      return notFoundResponse('Agendamento não encontrado.');
    }

    if (existing.status !== 'CONFIRMED' && existing.status !== 'PENDING') {
      return conflictResponse('Este agendamento não pode mais ser cancelado.');
    }

    if (existing.startTime < new Date()) {
      return validationResponse('Não é possível cancelar agendamentos passados ou em andamento.');
    }

    await new ChangeAppointmentStatusUseCase(appointmentRepo, new PrismaBarberRepository()).execute({
      appointmentId,
      newStatus: 'CANCELED',
      userId: session.user.id,
      userRole: 'CLIENT',
    });

    try {
      const barberRecord = await prisma.barber.findUnique({
        where: { id: existing.barberId },
        select: { userId: true },
      });
      if (barberRecord?.userId) {
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(existing.startTime);

        await prisma.notification.create({
          data: {
            userId: barberRecord.userId,
            title: 'Agendamento cancelado',
            message: `${session.user.name || 'Cliente'} cancelou o agendamento de ${formattedDate}.`,
            type: 'CANCEL',
            read: false,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao notificar cancelamento:', notifErr);
    }

    revalidatePath('/barber/agenda');
    revalidatePath('/barber/dashboard');
    revalidatePath('/agenda');
    revalidatePath(`/agenda/${appointmentId}`);

    return actionSuccess({ message: 'Agendamento cancelado com sucesso.' });
  } catch (error: unknown) {
    console.error('Error canceling appointment:', error);
    return toStructuredError(error, 'Erro ao cancelar o agendamento.');
  }
}

export async function rescheduleAppointmentAction(data: {
  appointmentId: string;
  newStartTimeStr: string; // ISO string
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return authRequiredResponse('Você precisa estar logado para reagendar.');
    }

    const { appointmentId, newStartTimeStr } = data;
    const newStartTime = new Date(newStartTimeStr);
    if (isNaN(newStartTime.getTime())) {
      return validationResponse('Nova data ou horário inválido.');
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();
    const barberRepo = new PrismaBarberRepository();

    const useCase = new RescheduleAppointmentUseCase(
      appointmentRepo,
      serviceRepo,
      barberRepo
    );

    const updated = await useCase.execute({
      appointmentId,
      clientId: session.user.id,
      newStartTime,
    });

    try {
      const barberRecord = await prisma.barber.findUnique({
        where: { id: updated.barberId },
        select: { userId: true },
      });
      if (barberRecord?.userId) {
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(newStartTime);

        await prisma.notification.create({
          data: {
            userId: barberRecord.userId,
            title: 'Agendamento reagendado',
            message: `${session.user.name || 'Cliente'} alterou o horário do agendamento para ${formattedDate}.`,
            type: 'INFO',
            read: false,
          },
        });
      }
    } catch (notifErr) {
      console.error('Erro ao notificar reagendamento:', notifErr);
    }

    revalidatePath('/barber/agenda');
    revalidatePath('/barber/dashboard');
    revalidatePath('/agenda');
    revalidatePath(`/agenda/${appointmentId}`);

    return actionSuccess({ appointment: updated, message: 'Agendamento reagendado com sucesso!' });
  } catch (error: unknown) {
    console.error('Error rescheduling appointment:', error);
    return toStructuredError(error, 'Erro ao reagendar agendamento.');
  }
}

