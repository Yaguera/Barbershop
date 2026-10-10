'use server';
import { PrismaAppointmentReportRepository } from '@/infra/repositories/PrismaAppointmentReportRepository';

import { auth } from '@/auth';
import { ChangeAppointmentStatusUseCase } from '@/core/usecases/ChangeAppointmentStatusUseCase';
import { CreateAppointmentUseCase } from '@/core/usecases/CreateAppointmentUseCase';
import { GetBarberMetricsUseCase } from '@/core/usecases/GetBarberMetricsUseCase';
import { GetBarberMonthScheduleUseCase } from '@/core/usecases/GetBarberMonthScheduleUseCase';
import { RescheduleAppointmentUseCase } from '@/core/usecases/RescheduleAppointmentUseCase';
import { parseLocalDate } from '@/core/utils/date-utils';
import { barberAppointments,clientAppointments } from '@/infra/repositories/appointment-queries';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';

// Action to create a new appointment (RF03/RF04)
export async function createAppointmentAction(data: {
  barberId: string;
  serviceId: string;
  startTimeStr: string; // ISO string
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Você precisa estar logado para agendar.' };
    }

    const { barberId, serviceId, startTimeStr } = data;
    const startTime = new Date(startTimeStr);

    if (isNaN(startTime.getTime())) {
      return { success: false, error: 'Data/Hora de início inválida.' };
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

    return { success: true, appointment };
  } catch (error: unknown) {
    console.error('Error creating appointment:', error);
    const err = error as Error & { status?: number };
    return {
      success: false,
      error: err.status === 409
        ? 'Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.'
        : err.message || 'Erro ao criar agendamento.',
    };
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
      return { success: false, error: 'Não autorizado.' };
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

    return { success: true, message: 'Status atualizado com sucesso!' };
  } catch (error: unknown) {
    console.error('Error updating appointment status:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao atualizar status.' };
  }
}

// Action to retrieve appointments for the current client
export async function getClientAppointmentsAction(page = 1, upcomingOnly = false) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Não autorizado.' };
    }

    if (!Number.isInteger(page) || page < 1 || page > 10000) return { success: false, error: 'Página inválida.' };
    const result = await clientAppointments(session.user.id, page, upcomingOnly);
    return { success: true, ...result };
  } catch (error: unknown) {
    console.error('Error fetching client appointments:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar agendamentos.' };
  }
}

// Action to retrieve appointments for the current barber's queue (RF07/RF08)
export async function getBarberAppointmentsAction(dateStr?: string) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'BARBER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Não autorizado.' };
    }

    const barberRepo = new PrismaBarberRepository();
    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();

    // 1. Find Barber profile linked to current user
    let barberId = '';
    if (session.user.role === 'BARBER') {
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return { success: false, error: 'Perfil de barbeiro não encontrado.' };
      }
      barberId = barber.id;
    } else {
      // If Admin, they can view the first barber or we let them pass a barberId (we can fallback)
      const barbers = await barberRepo.findAll();
      if (barbers.length === 0) {
        return { success: true, appointments: [] };
      }
      barberId = barbers[0].id;
    }

    const appointments = await barberAppointments(barberId, parseLocalDate(dateStr));
    return { success: true, appointments, barberId };
  } catch (error: unknown) {
    console.error('Error fetching barber appointments:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar agendamentos.' };
  }
}

export async function getBarberMonthScheduleAction(year: number, month: number, barberIdParam?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autenticado.' };
    }

    if (!['ADMIN', 'BARBER'].includes(session.user.role)) return { success: false, error: 'Não autorizado.' };
    if (session.user.role === 'BARBER' && barberIdParam) {
      const ownBarber = await new PrismaBarberRepository().findByUserId(session.user.id);
      if (ownBarber?.id !== barberIdParam) return { success: false, error: 'Acesso negado.' };
    }
    let barberId = barberIdParam;
    if (!barberId) {
      const barberRepo = new PrismaBarberRepository();
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return { success: false, error: 'Perfil de barbeiro não encontrado.' };
      }
      barberId = barber.id;
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const useCase = new GetBarberMonthScheduleUseCase(new PrismaAppointmentReportRepository());
    const occupancy = await useCase.execute({ barberId, year, month });

    return { success: true, occupancy, barberId };
  } catch (error: unknown) {
    console.error('Error fetching barber month schedule:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar agenda do mês.' };
  }
}

export async function getBarberMetricsDetailedAction(
  period: 'today' | 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  barberIdParam?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'BARBER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Não autorizado ou sessão inválida.' };
    }

    const barberRepo = new PrismaBarberRepository();
    let barberId = '';
    if (session.user.role === 'ADMIN' && barberIdParam) {
      barberId = barberIdParam;
    } else if (session.user.role === 'BARBER') {
      const barber = await barberRepo.findByUserId(session.user.id);
      if (!barber) {
        return { success: false, error: 'Perfil profissional do barbeiro não encontrado.' };
      }
      barberId = barber.id;
    } else {
      const barbers = await barberRepo.findAll();
      if (barbers.length === 0) {
        return { success: true, report: null, barberId: '', barber: null };
      }
      barberId = barbers[0].id;
    }

    const barber = await barberRepo.findById(barberId);
    const specialty = barber ? await barberRepo.getBarberSpecialty(barber.id) : null;

    const useCase = new GetBarberMetricsUseCase(new PrismaAppointmentReportRepository());
    const report = await useCase.execute({ barberId, period });

    return {
      success: true,
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
    };
  } catch (error: unknown) {
    console.error('Error fetching detailed barber metrics:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar métricas detalhadas do barbeiro.' };
  }
}

export async function getAppointmentDetailsAction(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autorizado.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();
    const barberRepo = new PrismaBarberRepository();

    const appointment = await appointmentRepo.findByIdWithRelations(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Agendamento não encontrado.' };
    }

    const ownBarber = session.user.role === 'BARBER' ? await barberRepo.findByUserId(session.user.id) : null;
    // Ownership is checked on the server, independently of page access.
    if (
      session.user.role !== 'ADMIN' &&
      ownBarber?.id !== appointment.barberId &&
      appointment.clientId !== session.user.id
    ) {
      return { success: false, error: 'Acesso negado a este agendamento.' };
    }

    const barber = await barberRepo.findById(appointment.barberId);
    const specialty = barber ? await barberRepo.getBarberSpecialty(barber.id) : null;

    return {
      success: true,
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
        barberSpecialty: specialty || 'Master Barber & Hair Stylist',
        barberImage: barber?.user?.image || null,
        clientName: appointment.client?.name || 'Cliente VIP',
      },
    };
  } catch (error: unknown) {
    console.error('Error fetching appointment details:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar detalhes.' };
  }
}

export async function cancelAppointmentByClientAction(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Você precisa estar logado.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const existing = await appointmentRepo.findById(appointmentId);
    if (!existing || existing.clientId !== session.user.id) {
      return { success: false, error: 'Agendamento não encontrado ou não autorizado.' };
    }

    if (existing.status !== 'CONFIRMED' && existing.status !== 'PENDING') {
      return { success: false, error: 'Este agendamento não pode mais ser cancelado.' };
    }

    if (existing.startTime < new Date()) {
      return { success: false, error: 'Não é possível cancelar agendamentos passados ou em andamento.' };
    }

    await new ChangeAppointmentStatusUseCase(appointmentRepo, new PrismaBarberRepository()).execute({ appointmentId, newStatus: 'CANCELED', userId: session.user.id, userRole: 'CLIENT' });
    return { success: true, message: 'Agendamento cancelado com sucesso.' };
  } catch (error: unknown) {
    console.error('Error canceling appointment:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao cancelar o agendamento.' };
  }
}

export async function rescheduleAppointmentAction(data: {
  appointmentId: string;
  newStartTimeStr: string; // ISO string
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Você precisa estar logado para reagendar.' };
    }

    const { appointmentId, newStartTimeStr } = data;
    const newStartTime = new Date(newStartTimeStr);
    if (isNaN(newStartTime.getTime())) {
      return { success: false, error: 'Nova data ou horário inválido.' };
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

    return { success: true, appointment: updated, message: 'Agendamento reagendado com sucesso!' };
  } catch (error: unknown) {
    console.error('Error rescheduling appointment:', error);
    const err = error as Error & { status?: number };
    return {
      success: false,
      error: err.status === 409
        ? 'Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro.'
        : err.message || 'Erro ao reagendar agendamento.',
    };
  }
}

