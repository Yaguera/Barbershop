'use server';

import { auth } from '@/auth';
import {
  authRequiredResponse,
  forbiddenResponse,
  toStructuredError,
} from '@/core/domain/errors';
import { prisma } from '@/infra/db/prisma-client';
import { revalidatePath } from 'next/cache';

export async function getNotificationsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
      error: 'Não autenticado.',
      notifications: [],
      unreadCount: 0,
    };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      success: true,
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return {
      success: false,
      code: 'INTERNAL_ERROR',
      status: 500,
      error: 'Erro ao carregar notificações.',
      notifications: [],
      unreadCount: 0,
    };
  }
}

export async function markAsReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return authRequiredResponse();
  }

  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { read: true },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return toStructuredError(error, 'Erro ao atualizar notificação.');
  }
}

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return authRequiredResponse();
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return toStructuredError(error, 'Erro ao atualizar notificações.');
  }
}

export async function createNotificationAction(data: {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'REMINDER' | 'ALERT' | 'CANCEL' | 'NO_SHOW';
}) {
  const session = await auth();
  if (!session?.user) {
    return authRequiredResponse();
  }
  if (session.user.role !== 'ADMIN') {
    return forbiddenResponse('Apenas administradores podem criar notificações arbitrárias.');
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        read: false,
      },
    });
    return { success: true, notification };
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return toStructuredError(error, 'Erro ao criar notificação.');
  }
}
