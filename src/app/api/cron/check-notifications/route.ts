import { NextResponse } from 'next/server';
import { prisma } from '@/infra/db/prisma-client';

export async function POST(request: Request) {
  try {
    const now = new Date();

    // Fetch active (PENDING) appointments within window of -2 hours to +25 hours from now
    const windowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'PENDING',
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    let processedReminders = 0;
    let autoCancellations = 0;

    for (const appt of appointments) {
      const timeDiffMs = appt.startTime.getTime() - now.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      const timePassedMinutes = (now.getTime() - appt.startTime.getTime()) / (1000 * 60);

      const formattedTime = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(appt.startTime);

      // 1. AUTO NO-SHOW CANCELLATION (After 15 minutes of tolerance past start time)
      if (timePassedMinutes > 15 && appt.status === 'PENDING') {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { status: 'CANCELED' },
        });

        // Notify client
        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            title: '❌ Agendamento Cancelado (No-Show)',
            message: `Seu agendamento das ${formattedTime} (${appt.service.name}) foi cancelado automaticamente por não comparecimento após 15 minutos de tolerância.`,
            type: 'NO_SHOW',
          },
        });

        // Notify barber
        if (appt.barber.userId) {
          await prisma.notification.create({
            data: {
              userId: appt.barber.userId,
              title: '⚠️ No-Show Automático',
              message: `O agendamento de ${appt.client.name || 'Cliente'} das ${formattedTime} foi cancelado automaticamente por ausência/não comparecimento.`,
              type: 'NO_SHOW',
            },
          });
        }

        autoCancellations++;
        continue; // Skip further reminders for canceled appointment
      }

      // 2. CHECK 24 HOURS REMINDER (between 24h and 1h ahead)
      if (timeDiffMinutes <= 24 * 60 && timeDiffMinutes > 60 && !appt.reminded24h) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminded24h: true },
        });

        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            title: '📅 Lembrete de Agendamento (24h)',
            message: `Lembrete VIP: Seu agendamento de ${appt.service.name} com ${appt.barber.user.name || 'Barbeiro'} é amanhã às ${formattedTime}.`,
            type: 'REMINDER',
          },
        });
        processedReminders++;
      }

      // 3. CHECK 1 HOUR REMINDER (between 60m and 15m ahead)
      if (timeDiffMinutes <= 60 && timeDiffMinutes > 15 && !appt.reminded1h) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminded1h: true },
        });

        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            title: '⏰ Lembrete de Agendamento (1h)',
            message: `Falta apenas 1 hora! Seu agendamento de ${appt.service.name} será hoje às ${formattedTime}.`,
            type: 'REMINDER',
          },
        });
        processedReminders++;
      }

      // 4. CHECK 15 MINUTES REMINDER (between 15m and 0m ahead)
      if (timeDiffMinutes <= 15 && timeDiffMinutes > 0 && !appt.reminded15m) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminded15m: true },
        });

        // Client notification
        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            title: '⚡ Lembrete Urgente (15 min)',
            message: `Prepare-se! Seu horário de ${appt.service.name} com ${appt.barber.user.name || 'Barbeiro'} começa em 15 minutos (${formattedTime}).`,
            type: 'ALERT',
          },
        });

        // Barber notification
        if (appt.barber.userId) {
          await prisma.notification.create({
            data: {
              userId: appt.barber.userId,
              title: '💈 Próximo Atendimento em 15 min',
              message: `Prepare a bancada: ${appt.client.name || 'Cliente'} chega às ${formattedTime} para ${appt.service.name}.`,
              type: 'ALERT',
            },
          });
        }
        processedReminders++;
      }

      // 5. AT START TIME REMINDER (between 0m and 15m past start time)
      if (timePassedMinutes >= 0 && timePassedMinutes <= 15 && !appt.remindedStart) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { remindedStart: true },
        });

        // Client notification
        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            title: '✨ Seu horário começou!',
            message: `Chegou a hora do seu atendimento VIP das ${formattedTime} (${appt.service.name}). Seja bem-vindo!`,
            type: 'INFO',
          },
        });

        // Barber notification
        if (appt.barber.userId) {
          await prisma.notification.create({
            data: {
              userId: appt.barber.userId,
              title: '✂️ Atendimento Iniciado',
              message: `O horário das ${formattedTime} de ${appt.client.name || 'Cliente'} (${appt.service.name}) começou.`,
              type: 'INFO',
            },
          });
        }
        processedReminders++;
      }
    }

    return NextResponse.json({
      success: true,
      processedReminders,
      autoCancellations,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Erro no cron de verificações de notificações:', error);
    return NextResponse.json({ success: false, error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// Also support GET for simple external cron monitoring or periodic client fetching check
export async function GET(request: Request) {
  return POST(request);
}
