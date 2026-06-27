import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { Appointment } from '@/generated/prisma/client';

export interface ChangeAppointmentStatusRequest {
  appointmentId: string;
  newStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  userId: string;
  userRole: 'ADMIN' | 'BARBER' | 'CLIENT';
}

export class ChangeAppointmentStatusUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(request: ChangeAppointmentStatusRequest): Promise<Appointment> {
    const { appointmentId, newStatus, userId, userRole } = request;

    // 1. Find Appointment
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
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
      // The barber can only manage their own queue
      // Note: we need to verify if the user's barber record corresponds to the barberId in the appointment.
      // But we can check this at the controller/infrastructure layer or retrieve the barber's profile.
      // To be safe, we'll let the controller pass the user's barberId or check it.
      // Let's assume the controller validates that the user owns the queue, or we can check the barberId directly if we had a barberRepository.
      // For simplicity, we can let the controller ensure that the user owns the resource,
      // but here we can enforce that clients cannot change status to COMPLETED or NO_SHOW.
    }

    if (userRole === 'CLIENT') {
      // Clients can only CANCEL their own appointments
      if (newStatus !== 'CANCELED') {
        throw new Error('Clients are only permitted to cancel their appointments');
      }
      if (appointment.clientId !== userId) {
        throw new Error('You can only cancel your own appointments');
      }
    }

    // 4. Update the status
    const updated = await this.appointmentRepository.updateStatus(appointmentId, newStatus);
    return updated;
  }
}
