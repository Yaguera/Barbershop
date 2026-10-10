import { Appointment } from '@/core/domain/models';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';

export interface ChangeAppointmentStatusRequest {
  appointmentId: string;
  newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  userId: string;
  userRole: 'ADMIN' | 'BARBER' | 'CLIENT';
}

export class ChangeAppointmentStatusUseCase {
  constructor(private appointmentRepository: AppointmentRepository, private barberRepository: BarberRepository) {}

  async execute(request: ChangeAppointmentStatusRequest): Promise<Appointment> {
    const { appointmentId, newStatus, userId, userRole } = request;

    if (!['ADMIN', 'BARBER', 'CLIENT'].includes(userRole) || !['PENDING', 'COMPLETED', 'CANCELED', 'NO_SHOW'].includes(newStatus)) {
      throw new Error('Não autorizado ou status inválido.');
    }
    // 1. Find Appointment
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Validação de Domínio: Bloqueio de Status "Não Compareceu" Prematuro
    if (newStatus === 'NO_SHOW') {
      const now = new Date();
      if (now < appointment.startTime) {
        const error = new Error("Não é possível marcar como 'Não compareceu' antes do horário agendado.") as Error & { status?: number };
        error.status = 400;
        throw error;
      }
    }

    // Trava de Transição de Estado: Imutabilidade de Agendamentos Cancelados
    if (appointment.status === 'CANCELED') {
      const error = new Error("Operação inválida: Este agendamento já foi cancelado e não pode sofrer novas alterações.") as Error & { status?: number };
      error.status = 400;
      throw error;
    }

    // 2. Check current status rules (RN07.3)
    if (appointment.status === 'COMPLETED') {
      // Once marked as COMPLETED, it is immutable for the barber (only Admin can audit and correct)
      if (userRole !== 'ADMIN') {
        throw new Error('This appointment is COMPLETED and can only be modified by an administrator');
      }
    }

    // 3. Authorization Checks
    if (userRole === 'BARBER') {
      const barber = await this.barberRepository.findByUserId(userId);
      if (!barber || barber.id !== appointment.barberId) {
        throw new Error('Você só pode gerenciar seus próprios agendamentos.');
      }
    }

    if (userRole === 'CLIENT') {
      if (appointment.startTime <= new Date()) throw new Error('Não é possível cancelar agendamentos passados ou em andamento.');
      // Clients can only CANCEL their own appointments
      if (newStatus !== 'CANCELED') {
        throw new Error('Clients are only permitted to cancel their appointments');
      }
      if (appointment.clientId !== userId) {
        throw new Error('You can only cancel your own appointments');
      }
    }

    if ((newStatus === 'PENDING' && appointment.status !== 'PENDING') || (newStatus === 'COMPLETED' && appointment.status === 'NO_SHOW')) {
      throw new Error('Não é possível reabrir um agendamento finalizado. Crie uma nova reserva.');
    }
    // 4. Update the status
    const updated = await this.appointmentRepository.updateStatus(appointmentId, newStatus, appointment.status);
    return updated;
  }
}
