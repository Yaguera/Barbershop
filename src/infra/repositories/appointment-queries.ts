import { endOfDay, startOfDay } from '@/core/utils/date-utils';
import { prisma } from '../db/prisma-client';

const appointmentSelect = {
  id: true,
  clientId: true,
  clientContactId: true,
  barberId: true,
  serviceId: true,
  startTime: true,
  endTime: true,
  status: true,
  origin: true,
  createdById: true,
  priceCents: true,
  client: { select: { name: true, email: true, image: true } },
  clientContact: { select: { name: true, phone: true, email: true } },
  service: { select: { name: true, durationMinutes: true } },
  barber: { select: { id: true, user: { select: { name: true, image: true } } } },
  receipt: { select: { id: true, amountCents: true, method: true, status: true, confirmedAt: true } },
} as const;

export async function clientAppointments(clientId: string, page = 1, upcomingOnly = false) {
  const pageSize = 30;
  const rows = await prisma.appointment.findMany({
    where: {
      clientId,
      ...(upcomingOnly ? { status: 'PENDING', startTime: { gte: new Date(Date.now() - 15 * 60000) } } : {}),
    },
    select: appointmentSelect,
    orderBy: [{ startTime: upcomingOnly ? 'asc' : 'desc' }, { id: 'asc' }],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });
  return {
    hasMore: rows.length > pageSize,
    appointments: rows.slice(0, pageSize).map((row) => ({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      barberId: row.barberId,
      serviceId: row.serviceId,
      serviceName: row.service.name,
      servicePrice: row.priceCents / 100,
      barberName: row.barber.user.name || 'Barbeiro',
    })),
  };
}

export async function barberAppointments(barberId: string, date: Date) {
  const rows = await prisma.appointment.findMany({
    where: { barberId, startTime: { gte: startOfDay(date), lte: endOfDay(date) } },
    select: appointmentSelect,
    orderBy: { startTime: 'asc' },
  });
  return rows.map((row) => {
    const isPaid = row.receipt?.status === 'CONFIRMED';
    return {
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      origin: row.origin,
      clientName: row.client?.name || row.clientContact?.name || 'Cliente',
      clientEmail: row.client?.email || row.clientContact?.email || null,
      clientPhone: row.clientContact?.phone || null,
      clientImage: row.client?.image || null,
      isRegisteredClient: !!row.client,
      serviceName: row.service.name,
      servicePrice: row.priceCents / 100,
      isPaid,
      paymentStatus: row.status === 'COMPLETED' ? (isPaid ? 'PAID' : 'AWAITING_PAYMENT') : 'NOT_APPLICABLE',
    };
  });
}

export async function teamAppointmentsForDate(date: Date, barberId?: string) {
  const rows = await prisma.appointment.findMany({
    where: {
      startTime: { gte: startOfDay(date), lte: endOfDay(date) },
      ...(barberId ? { barberId } : {}),
    },
    select: appointmentSelect,
    orderBy: { startTime: 'asc' },
  });

  return rows.map((row) => {
    const isPaid = row.receipt?.status === 'CONFIRMED';
    return {
      id: row.id,
      barberId: row.barberId,
      barberName: row.barber.user.name || 'Profissional',
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      origin: row.origin,
      clientName: row.client?.name || row.clientContact?.name || 'Cliente',
      clientEmail: row.client?.email || row.clientContact?.email || null,
      clientPhone: row.clientContact?.phone || null,
      isRegisteredClient: !!row.client,
      serviceName: row.service.name,
      serviceDuration: row.service.durationMinutes,
      servicePrice: row.priceCents / 100,
      priceCents: row.priceCents,
      isPaid,
      paymentStatus: row.status === 'COMPLETED' ? (isPaid ? 'PAID' : 'AWAITING_PAYMENT') : 'NOT_APPLICABLE',
    };
  });
}
