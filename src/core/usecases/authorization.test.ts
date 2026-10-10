import { describe,expect,it,vi } from 'vitest';
import type { Appointment } from '../domain/models';
import type { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import type { BarberRepository } from '../domain/repositories/BarberRepository';
import { ChangeAppointmentStatusUseCase } from './ChangeAppointmentStatusUseCase';

function fixture(barberId = 'barber-a') {
  const appointment = { id: 'booking', barberId: 'barber-a', clientId: 'client-a', status: 'PENDING', startTime: new Date(Date.now() + 3600000) } as Appointment;
  const updateStatus = vi.fn().mockResolvedValue({ ...appointment, status: 'CANCELED' });
  const repo = { findById: vi.fn().mockResolvedValue(appointment), updateStatus } as unknown as AppointmentRepository;
  const barbers = { findByUserId: vi.fn().mockResolvedValue({ id: barberId }) } as unknown as BarberRepository;
  return { useCase: new ChangeAppointmentStatusUseCase(repo, barbers), updateStatus, appointment };
}
describe('appointment authorization', () => {
  it('rejects a barber from another queue without writing', async () => {
    const f = fixture('barber-b');
    await expect(f.useCase.execute({ appointmentId: 'booking', newStatus: 'CANCELED', userId: 'user-b', userRole: 'BARBER' })).rejects.toThrow('próprios');
    expect(f.updateStatus).not.toHaveBeenCalled();
  });
  it('allows the assigned barber and uses a conditional update', async () => {
    const f = fixture();
    await f.useCase.execute({ appointmentId: 'booking', newStatus: 'CANCELED', userId: 'user-a', userRole: 'BARBER' });
    expect(f.updateStatus).toHaveBeenCalledWith('booking', 'CANCELED', 'PENDING');
  });
  it('rejects another client', async () => {
    const f = fixture();
    await expect(f.useCase.execute({ appointmentId: 'booking', newStatus: 'CANCELED', userId: 'client-b', userRole: 'CLIENT' })).rejects.toThrow('own');
    expect(f.updateStatus).not.toHaveBeenCalled();
  });
  it('rejects runtime values outside the status union', async () => {
    const f = fixture();
    await expect(f.useCase.execute({ appointmentId: 'booking', newStatus: 'INVALID' as 'PENDING', userId: 'admin', userRole: 'ADMIN' })).rejects.toThrow('inválido');
  });
  it('does not reopen a no-show into an occupied slot', async () => {
    const f = fixture(); f.appointment.status = 'NO_SHOW';
    await expect(f.useCase.execute({ appointmentId: 'booking', newStatus: 'PENDING', userId: 'admin', userRole: 'ADMIN' })).rejects.toThrow('reabrir');
  });
  it('rejects client cancellation after start', async () => {
    const f = fixture(); f.appointment.startTime = new Date(Date.now() - 1000);
    await expect(f.useCase.execute({ appointmentId: 'booking', newStatus: 'CANCELED', userId: 'client-a', userRole: 'CLIENT' })).rejects.toThrow('passados');
  });
});
