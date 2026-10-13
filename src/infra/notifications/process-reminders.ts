import { reminderKind } from '@/core/utils/reminder-policy';
import { prisma } from '../db/prisma-client';

/** One transaction per appointment; the row lock serializes competing workers. */
export async function processReminders(now = new Date()) {
  const candidates = await prisma.appointment.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { startTime: { lt: new Date(now.getTime() - 15 * 60000) } },
        { startTime: { gte: now, lte: new Date(now.getTime() + 24 * 3600000) }, reminded24h: false },
        { startTime: { gte: now, lte: new Date(now.getTime() + 3600000) }, reminded1h: false },
        { startTime: { gte: now, lte: new Date(now.getTime() + 15 * 60000) }, reminded15m: false },
        { startTime: { gte: new Date(now.getTime() - 15 * 60000), lte: now }, remindedStart: false },
      ],
    },
    select: { id: true },
    orderBy: { startTime: 'asc' },
    take: 200,
  });

  let processedReminders = 0;
  let autoNoShows = 0;

  for (const candidate of candidates) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Appointment" WHERE id = ${candidate.id} FOR UPDATE`;
      const appt = await tx.appointment.findUnique({
        where: { id: candidate.id },
        include: {
          service: { select: { name: true } },
          barber: { select: { userId: true } },
        },
      });
      if (!appt || appt.status !== 'PENDING') return null;
      const kind = reminderKind(appt.startTime, now);
      if (!kind || (kind !== 'NO_SHOW' && appt[kind])) return null;

      const time = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(appt.startTime);

      const noShow = kind === 'NO_SHOW';
      const title = noShow ? 'Ausência registrada' : kind === 'remindedStart' ? 'Seu horário começou' : 'Lembrete de agendamento';
      const message = noShow
        ? `Ausência registrada para ${appt.service.name}, em ${time}, após 15 minutos de tolerância.`
        : `${appt.service.name}: atendimento agendado para ${time}.`;

      const data = noShow
        ? { status: 'NO_SHOW' }
        : {
            reminded24h: true,
            ...(kind !== 'reminded24h' ? { reminded1h: true } : {}),
            ...(kind === 'reminded15m' || kind === 'remindedStart' ? { reminded15m: true } : {}),
            ...(kind === 'remindedStart' ? { remindedStart: true } : {}),
          };

      await tx.appointment.update({ where: { id: appt.id }, data });

      const rawRecipients = noShow || kind === 'reminded15m' || kind === 'remindedStart'
        ? [appt.clientId, appt.barber.userId]
        : [appt.clientId];

      const recipients = [...new Set(rawRecipients.filter((id): id is string => typeof id === 'string' && id.length > 0))];

      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((userId) => ({
            userId,
            title,
            message,
            type: noShow ? 'NO_SHOW' : 'REMINDER',
          })),
        });
      }

      return noShow ? 'NO_SHOW' : 'REMINDER';
    });

    if (result === 'NO_SHOW') autoNoShows++;
    if (result === 'REMINDER') processedReminders++;
  }

  return { processedReminders, autoNoShows, batchFull: candidates.length === 200 };
}
