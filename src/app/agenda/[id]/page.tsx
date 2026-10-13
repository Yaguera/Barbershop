import { auth } from '@/auth';
import { ForbiddenView } from '@/components/auth/ForbiddenView';
import { UnauthorizedView } from '@/components/auth/UnauthorizedView';
import { PrismaAppointmentRepository } from '@/infra/repositories/PrismaAppointmentRepository';
import { PrismaBarberRepository } from '@/infra/repositories/PrismaBarberRepository';
import { notFound } from 'next/navigation';
import { AppointmentDetailClient } from './AppointmentDetailClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView callbackUrl={`/agenda/${id}`} />;
  }

  if (session.user.role !== 'CLIENT') {
    return (
      <ForbiddenView
        currentRole={session.user.role}
        allowedRoles={['CLIENT']}
        message="Esta área é exclusiva para clientes consultarem seus agendamentos."
      />
    );
  }

  const appointmentRepo = new PrismaAppointmentRepository();
  const barberRepo = new PrismaBarberRepository();

  const appointment = await appointmentRepo.findByIdWithRelations(id);
  if (!appointment || appointment.clientId !== session.user.id) {
    notFound();
  }

  const barber = await barberRepo.findById(appointment.barberId);
  const specialty = barber ? await barberRepo.getBarberSpecialty(barber.id) : null;

  const detail = {
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
  };

  return <AppointmentDetailClient initialAppointment={detail} />;
}
