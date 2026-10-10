import { endOfDay,startOfDay } from '@/core/utils/date-utils';
import { prisma } from '../db/prisma-client';
const select = {
  id: true, clientId: true, barberId: true, serviceId: true, startTime: true, endTime: true, status: true, priceCents: true,
  client: { select: { name: true, email: true, image: true } },
  service: { select: { name: true } },
  barber: { select: { user: { select: { name: true } } } },
} as const;
export async function clientAppointments(clientId: string, page = 1, upcomingOnly = false) {
  const pageSize = 30;
  const rows = await prisma.appointment.findMany({
    where: { clientId, ...(upcomingOnly ? { status: 'PENDING', startTime: { gte: new Date(Date.now() - 15 * 60000) } } : {}) }, select,
    orderBy: [{ startTime: upcomingOnly ? 'asc' : 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize + 1,
  });
  return { hasMore: rows.length > pageSize, appointments: rows.slice(0, pageSize).map(row => ({
    id: row.id, startTime: row.startTime, endTime: row.endTime, status: row.status,
    barberId: row.barberId, serviceId: row.serviceId,
    serviceName: row.service.name, servicePrice: row.priceCents / 100, barberName: row.barber.user.name || 'Barbeiro',
  })) };
}
export async function barberAppointments(barberId: string, date: Date) {
  const rows = await prisma.appointment.findMany({
    where: { barberId, startTime: { gte: startOfDay(date), lte: endOfDay(date) } }, select, orderBy: { startTime: 'asc' },
  });
  return rows.map(row => ({ id: row.id, startTime: row.startTime, endTime: row.endTime, status: row.status,
    clientName: row.client.name || 'Cliente', clientEmail: row.client.email, clientImage: row.client.image,
    serviceName: row.service.name, servicePrice: row.priceCents / 100,
  }));
}
