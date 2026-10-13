import { PaymentMethod, PaymentReceipt, PaymentReversal } from '@/core/domain/models';
import {
  CashRegisterSummary,
  ConfirmedReceiptItem,
  PaymentReceiptRepository,
  PendingAppointmentItem,
} from '@/core/domain/repositories/PaymentReceiptRepository';
import { endOfDay, startOfDay } from '@/core/utils/date-utils';
import { prisma } from '../db/prisma-client';

export class PrismaPaymentReceiptRepository implements PaymentReceiptRepository {
  async findById(id: string): Promise<PaymentReceipt | null> {
    return await prisma.paymentReceipt.findUnique({
      where: { id },
    });
  }

  async findByAppointmentId(appointmentId: string): Promise<PaymentReceipt | null> {
    return await prisma.paymentReceipt.findUnique({
      where: { appointmentId },
    });
  }

  async findByIdempotencyKey(key: string): Promise<PaymentReceipt | null> {
    return await prisma.paymentReceipt.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async confirmPayment(data: {
    appointmentId: string;
    method: PaymentMethod | string;
    confirmedById: string;
    idempotencyKey?: string | null;
  }): Promise<PaymentReceipt> {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar idempotência se fornecida
      if (data.idempotencyKey) {
        const existingIdempotent = await tx.paymentReceipt.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existingIdempotent) {
          if (existingIdempotent.appointmentId !== data.appointmentId) {
            throw new Error('Chave de idempotência reutilizada com dados diferentes.');
          }
          return existingIdempotent;
        }
      }

      // 2. Lock do atendimento (Row-Level Lock)
      await tx.$queryRaw`
        SELECT id, "priceCents", status FROM "Appointment" WHERE id = ${data.appointmentId} FOR UPDATE
      `;

      const appointment = await tx.appointment.findUnique({
        where: { id: data.appointmentId },
        include: { receipt: true },
      });

      if (!appointment) {
        throw new Error('Atendimento não encontrado.');
      }

      if (appointment.status !== 'COMPLETED') {
        throw new Error('Apenas atendimentos marcados como concluídos pelo barbeiro podem ter o pagamento confirmado no caixa.');
      }

      if (appointment.receipt && appointment.receipt.status === 'CONFIRMED') {
        throw new Error('Este atendimento já possui recebimento confirmado.');
      }

      // Se já existia um recibo revertido, atualizamos para re-confirmar; caso contrário, criamos.
      if (appointment.receipt) {
        return await tx.paymentReceipt.update({
          where: { id: appointment.receipt.id },
          data: {
            amountCents: appointment.priceCents,
            method: data.method,
            confirmedById: data.confirmedById,
            confirmedAt: new Date(),
            idempotencyKey: data.idempotencyKey || null,
            status: 'CONFIRMED',
          },
        });
      }

      return await tx.paymentReceipt.create({
        data: {
          appointmentId: data.appointmentId,
          amountCents: appointment.priceCents,
          method: data.method,
          confirmedById: data.confirmedById,
          confirmedAt: new Date(),
          idempotencyKey: data.idempotencyKey || null,
          status: 'CONFIRMED',
        },
      });
    });
  }

  async revertPayment(data: {
    receiptId: string;
    reason: string;
    revertedById: string;
  }): Promise<PaymentReversal> {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id, status FROM "PaymentReceipt" WHERE id = ${data.receiptId} FOR UPDATE
      `;

      const receipt = await tx.paymentReceipt.findUnique({
        where: { id: data.receiptId },
        include: { reversal: true },
      });

      if (!receipt) {
        throw new Error('Recibo de pagamento não encontrado.');
      }

      if (receipt.status !== 'CONFIRMED') {
        throw new Error('Apenas recebimentos em estado confirmado podem ser revertidos.');
      }

      if (receipt.reversal) {
        throw new Error('Este recebimento já foi revertido anteriormente.');
      }

      await tx.paymentReceipt.update({
        where: { id: data.receiptId },
        data: { status: 'REVERSED' },
      });

      return await tx.paymentReversal.create({
        data: {
          receiptId: data.receiptId,
          reason: data.reason.trim(),
          revertedById: data.revertedById,
          revertedAt: new Date(),
        },
      });
    });
  }

  async getPendingAppointments(barberId?: string): Promise<PendingAppointmentItem[]> {
    const rows = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        ...(barberId && barberId !== 'all' ? { barberId } : {}),
        OR: [
          { receipt: null },
          { receipt: { status: 'REVERSED' } },
        ],
      },
      include: {
        client: { select: { name: true, phone: true, email: true } },
        clientContact: { select: { name: true, phone: true, email: true } },
        service: { select: { name: true } },
        barber: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });

    return rows.map((r) => ({
      id: r.id,
      barberId: r.barberId,
      barberName: r.barber.user.name || 'Barbeiro',
      serviceId: r.serviceId,
      serviceName: r.service.name,
      clientId: r.clientId,
      clientContactId: r.clientContactId,
      clientName: r.client?.name || r.clientContact?.name || 'Cliente',
      clientPhone: r.client?.phone || r.clientContact?.phone || null,
      clientEmail: r.client?.email || r.clientContact?.email || null,
      startTime: r.startTime,
      endTime: r.endTime,
      priceCents: r.priceCents,
      origin: r.origin,
    }));
  }

  async getConfirmedReceiptsForDay(date: Date, barberId?: string): Promise<ConfirmedReceiptItem[]> {
    const rows = await prisma.paymentReceipt.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedAt: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        ...(barberId && barberId !== 'all' ? { appointment: { barberId } } : {}),
      },
      include: {
        confirmedBy: { select: { name: true } },
        appointment: {
          include: {
            client: { select: { name: true } },
            clientContact: { select: { name: true } },
            service: { select: { name: true } },
            barber: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { confirmedAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      appointmentId: r.appointmentId,
      amountCents: r.amountCents,
      method: r.method,
      confirmedById: r.confirmedById,
      confirmedByName: r.confirmedBy.name || 'Atendente',
      confirmedAt: r.confirmedAt,
      status: r.status,
      clientName: r.appointment.client?.name || r.appointment.clientContact?.name || 'Cliente',
      serviceName: r.appointment.service.name,
      barberName: r.appointment.barber.user.name || 'Profissional',
      serviceStartTime: r.appointment.startTime,
    }));
  }

  async getCashRegisterSummary(date: Date): Promise<CashRegisterSummary> {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [todayReceipts, pendingAppointments] = await Promise.all([
      prisma.paymentReceipt.findMany({
        where: {
          status: 'CONFIRMED',
          confirmedAt: { gte: start, lte: end },
        },
        select: {
          amountCents: true,
          method: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            { receipt: null },
            { receipt: { status: 'REVERSED' } },
          ],
        },
        select: {
          priceCents: true,
        },
      }),
    ]);

    let receivedTodayCents = 0;
    let moneyCents = 0;
    let pixCents = 0;
    let cardCents = 0;

    for (const r of todayReceipts) {
      receivedTodayCents += r.amountCents;
      if (r.method === 'MONEY') moneyCents += r.amountCents;
      else if (r.method === 'PIX') pixCents += r.amountCents;
      else if (r.method === 'CARD') cardCents += r.amountCents;
    }

    const totalPendingCents = pendingAppointments.reduce((sum, a) => sum + a.priceCents, 0);

    return {
      receivedTodayCents,
      receivedTodayCount: todayReceipts.length,
      totalPendingCents,
      totalPendingCount: pendingAppointments.length,
      byMethodCents: {
        money: moneyCents,
        pix: pixCents,
        card: cardCents,
      },
    };
  }
}
