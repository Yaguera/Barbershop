import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma-client';
import { PrismaAdminCalendarRepository } from './PrismaAdminCalendarRepository';

const repository = new PrismaAdminCalendarRepository();
let clientId: string, barberUserId: string, adminId: string, barberId: string, serviceId: string;
beforeEach(async () => {
  const tag = randomUUID();
  const client = await prisma.user.create({ data: { email: `calendar-client-${tag}@example.test`, name: 'Cliente', role: 'CLIENT' } });
  const admin = await prisma.user.create({ data: { email: `calendar-admin-${tag}@example.test`, name: 'Administrador', role: 'ADMIN' } });
  const barber = await prisma.barber.create({ data: { workDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '18:00', user: { create: { email: `calendar-barber-${tag}@example.test`, name: 'Barbeiro', role: 'BARBER' } } } });
  const service = await prisma.service.create({ data: { name: `Corte ${tag}`, price: '30.00', commissionRate: '0.5000', durationMinutes: 30 } });
  clientId = client.id; adminId = admin.id; barberId = barber.id; barberUserId = barber.userId; serviceId = service.id;
});
afterEach(async () => {
  // Only fixtures belonging to this test; the runner requires a local *_test database.
  if (barberId) {
    await prisma.paymentReceipt.deleteMany({ where: { appointment: { barberId } } });
    await prisma.appointment.deleteMany({ where: { barberId } });
    await prisma.barber.deleteMany({ where: { id: barberId } });
  }
  await prisma.user.deleteMany({ where: { id: { in: [clientId, adminId, barberUserId].filter(Boolean) } } });
  if (serviceId) await prisma.service.deleteMany({ where: { id: serviceId } });
});
async function fixture(startTime: string, confirmedAt?: string, reversed = false) {
  const start = new Date(startTime);
  const appointment = await prisma.appointment.create({ data: { clientId, barberId, serviceId, startTime: start, endTime: new Date(start.getTime() + 1800000), status: 'COMPLETED', origin: 'ONLINE', priceCents: 3000, commissionCents: 1500 } });
  if (confirmedAt) {
    const receipt = await prisma.paymentReceipt.create({ data: { appointmentId: appointment.id, amountCents: 3000, confirmedById: adminId, confirmedAt: new Date(confirmedAt), method: 'PIX', status: reversed ? 'REVERSED' : 'CONFIRMED' } });
    if (reversed) await prisma.paymentReversal.create({ data: { receiptId: receipt.id, reason: 'Estorno de teste', revertedById: adminId } });
  }
  return appointment;
}
describe('Admin calendar in PostgreSQL', () => {
  it('distingue atendimento de ontem de pagamento de hoje, perto da meia-noite em Brasília', async () => {
    const appointment = await fixture('2030-10-14T02:30:00Z', '2030-10-14T04:00:00Z');
    const agenda = await repository.getMetrics(2030, 10, 13, { barberId, context: 'agenda' });
    const oldCash = await repository.getMetrics(2030, 10, 13, { barberId, context: 'cash', payment: 'paid' });
    const cash = await repository.getMetrics(2030, 10, 14, { barberId, context: 'cash', payment: 'paid' });
    expect(agenda.summary).toMatchObject({ count: 1, completed: 1, realizedCents: 3000, reservedMinutes: 30 });
    expect(oldCash.summary.receivedCents).toBe(0);
    expect(cash.summary).toMatchObject({ count: 1, receivedCents: 3000 });
    expect(cash.appointments[0]).toMatchObject({ id: appointment.id, startTime: '2030-10-14T02:30:00.000Z', commissionCents: 1500 });
  });
  it('exclui estorno do caixa e inclui o concluído nos serviços sem recebimento vigente', async () => {
    await fixture('2030-10-13T12:00:00Z', '2030-10-13T13:00:00Z', true);
    const cash = await repository.getMetrics(2030, 10, 13, { barberId, context: 'cash', payment: 'paid' });
    const unpaid = await repository.getMetrics(2030, 10, 13, { barberId, context: 'agenda', payment: 'unpaid', status: 'COMPLETED' });
    expect(cash.summary).toMatchObject({ count: 0, receivedCents: 0 });
    expect(unpaid.summary).toMatchObject({ count: 1, realizedCents: 3000, unpaidCents: 3000, receivedCents: 0 });
    expect(unpaid.appointments[0].paymentStatus).toBe('REVERSED');
  });
  it('agrupa dezembro pelo ano de Brasília e preserva profissional inativo', async () => {
    await fixture('2031-01-01T02:30:00Z');
    await prisma.user.update({ where: { id: barberUserId }, data: { active: false } });
    const year = await repository.getMetrics(2030, undefined, undefined, { barberId });
    const day = await repository.getMetrics(2030, 12, 31, { barberId });
    const january = await repository.getMetrics(2031, 1, undefined, { barberId });
    expect(year.buckets).toEqual([expect.objectContaining({ date: '2030-12', count: 1, realizedCents: 3000 })]);
    expect(day.appointments[0].barberActive).toBe(false);
    expect(january.summary.count).toBe(0);
  });
});
