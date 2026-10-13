'use server';

import { auth } from '@/auth';
import { CreateManualAppointmentUseCase } from '@/core/usecases/CreateManualAppointmentUseCase';
import { ConfirmPaymentReceiptUseCase } from '@/core/usecases/ConfirmPaymentReceiptUseCase';
import { parseLocalDate } from '@/core/utils/date-utils';
import { prisma } from '@/infra/db/prisma-client';
import { teamAppointmentsForDate } from '@/infra/repositories/appointment-queries';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { PrismaClientContactRepository } from '@/infra/repositories/PrismaClientContactRepository';
import { PrismaPaymentReceiptRepository } from '@/infra/repositories/PrismaPaymentReceiptRepository';
import { PrismaServiceRepository } from '@/infra/repositories/PrismaServiceRepository';
import { revalidatePath } from 'next/cache';

export async function getReceptionAgendaAction(dateStr?: string, barberId?: string) {
  try {
    const session = await auth();
    if (!session?.user || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Acesso restrito à recepção e administração.' };
    }

    const targetDate = dateStr ? parseLocalDate(dateStr) : new Date();
    const effectiveBarberId = barberId && barberId !== 'all' ? barberId : undefined;

    const [appointments, barbers, services] = await Promise.all([
      teamAppointmentsForDate(targetDate, effectiveBarberId),
      prisma.barber.findMany({
        where: { user: { active: true } },
        select: {
          id: true,
          workDays: true,
          workStart: true,
          workEnd: true,
          user: { select: { name: true, image: true } },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.service.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      success: true,
      appointments,
      barbers: barbers.map((b) => ({
        id: b.id,
        name: b.user.name || 'Barbeiro',
        image: b.user.image,
        workDays: b.workDays,
        workStart: b.workStart,
        workEnd: b.workEnd,
      })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        durationMinutes: s.durationMinutes,
      })),
    };
  } catch (error: unknown) {
    console.error('Error in getReceptionAgendaAction:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar agenda da recepção.' };
  }
}

export async function searchClientsForReceptionAction(query: string) {
  try {
    const session = await auth();
    if (!session?.user || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Acesso restrito.' };
    }

    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      return { success: true, clients: [] };
    }

    const [registeredUsers, contacts] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'CLIENT',
          active: true,
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { email: { contains: trimmed, mode: 'insensitive' } },
            { phone: { contains: trimmed } },
          ],
        },
        select: { id: true, name: true, phone: true, email: true },
        take: 8,
      }),
      prisma.clientContact.findMany({
        where: {
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { phone: { contains: trimmed } },
          ],
        },
        select: { id: true, name: true, phone: true, email: true },
        take: 8,
      }),
    ]);

    const results = [
      ...registeredUsers.map((u) => ({
        id: u.id,
        name: u.name || 'Cliente',
        phone: u.phone,
        email: u.email,
        type: 'REGISTERED' as const,
      })),
      ...contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        type: 'CONTACT' as const,
      })),
    ];

    return { success: true, clients: results };
  } catch (error: unknown) {
    console.error('Error in searchClientsForReceptionAction:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao buscar clientes.' };
  }
}

export async function createManualAppointmentAction(data: {
  customer: {
    type: 'REGISTERED' | 'NEW_CONTACT' | 'EXISTING_CONTACT';
    clientId?: string;
    contactId?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  origin: 'WHATSAPP' | 'WALK_IN';
  barberId: string;
  serviceId: string;
  startTimeStr: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Sessão expirada. Faça login novamente.' };
    }

    if (session.user.role !== 'RECEPTIONIST') {
      return {
        success: false,
        error: 'A criação manual de agendamentos para clientes sem conta é permitida exclusivamente para atendentes autenticadas.',
      };
    }

    const startTime = new Date(data.startTimeStr);
    if (isNaN(startTime.getTime())) {
      return { success: false, error: 'Data e hora inválidas.' };
    }

    const appointmentRepo = new PrismaAppointmentRepository();
    const serviceRepo = new PrismaServiceRepository();
    const barberRepo = new PrismaBarberRepository();
    const contactRepo = new PrismaClientContactRepository();

    const useCase = new CreateManualAppointmentUseCase(
      appointmentRepo,
      serviceRepo,
      barberRepo,
      contactRepo
    );

    const appointment = await useCase.execute({
      operatorUserId: session.user.id,
      operatorRole: session.user.role,
      customer: data.customer,
      origin: data.origin,
      barberId: data.barberId,
      serviceId: data.serviceId,
      startTime,
    });

    revalidatePath('/atendente');
    revalidatePath('/atendente/caixa');
    revalidatePath('/barber/agenda');

    return {
      success: true,
      message: 'Agendamento manual criado com sucesso!',
      appointment,
    };
  } catch (error: unknown) {
    console.error('Error in createManualAppointmentAction:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao criar agendamento manual.' };
  }
}

export async function getCashRegisterDataAction(dateStr?: string, barberId?: string) {
  try {
    const session = await auth();
    if (!session?.user || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Acesso restrito ao caixa.' };
    }

    const targetDate = dateStr ? parseLocalDate(dateStr) : new Date();
    const effectiveBarberId = barberId && barberId !== 'all' ? barberId : undefined;

    const receiptRepo = new PrismaPaymentReceiptRepository();

    const [pending, receiptsToday, summary, barbers] = await Promise.all([
      receiptRepo.getPendingAppointments(effectiveBarberId),
      receiptRepo.getConfirmedReceiptsForDay(targetDate, effectiveBarberId),
      receiptRepo.getCashRegisterSummary(targetDate),
      prisma.barber.findMany({
        where: { user: { active: true } },
        select: { id: true, user: { select: { name: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
    ]);

    return {
      success: true,
      pending,
      receiptsToday,
      summary,
      barbers: barbers.map((b) => ({ id: b.id, name: b.user.name || 'Barbeiro' })),
    };
  } catch (error: unknown) {
    console.error('Error in getCashRegisterDataAction:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao carregar dados do caixa.' };
  }
}

export async function confirmPaymentReceiptAction(data: {
  appointmentId: string;
  method: 'MONEY' | 'PIX' | 'CARD';
  idempotencyKey?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Acesso restrito: apenas atendente e administrador podem registrar pagamentos.' };
    }

    const receiptRepo = new PrismaPaymentReceiptRepository();
    const useCase = new ConfirmPaymentReceiptUseCase(receiptRepo);

    const receipt = await useCase.execute({
      appointmentId: data.appointmentId,
      method: data.method,
      operatorUserId: session.user.id,
      operatorRole: session.user.role,
      idempotencyKey: data.idempotencyKey,
    });

    revalidatePath('/atendente/caixa');
    revalidatePath('/atendente');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: 'Pagamento confirmado com sucesso no caixa!',
      receipt,
    };
  } catch (error: unknown) {
    console.error('Error in confirmPaymentReceiptAction:', error);
    const err = error as Error;
    return { success: false, error: err.message || 'Erro ao confirmar pagamento no caixa.' };
  }
}
