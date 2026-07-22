import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBarberAvailabilityUseCase } from './GetBarberAvailabilityUseCase';
import { CreateAppointmentUseCase } from './CreateAppointmentUseCase';
import { ChangeAppointmentStatusUseCase } from './ChangeAppointmentStatusUseCase';
import { GetAdminDashboardMetricsUseCase } from './GetAdminDashboardMetricsUseCase';
import { RescheduleAppointmentUseCase } from './RescheduleAppointmentUseCase';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';

// Mock values
const mockBarber = {
  id: 'barber-1',
  userId: 'user-barber-1',
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  workStart: '09:00',
  workEnd: '18:00',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: 'user-barber-1',
    name: 'Barber Jack',
    email: 'jack@barber.com',
    emailVerified: null,
    image: null,
    passwordHash: 'hash',
    role: 'BARBER',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const mockService = {
  id: 'service-1',
  name: 'Corte',
  price: 50.0,
  durationMinutes: 30,
  commissionRate: 0.40,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('App Barbearia Core Use Cases', () => {
  let barberRepo: BarberRepository;
  let appointmentRepo: AppointmentRepository;
  let serviceRepo: ServiceRepository;

  beforeEach(() => {
    barberRepo = {
      findById: vi.fn().mockResolvedValue(mockBarber),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      getBarberSpecialty: vi.fn(),
    };

    appointmentRepo = {
      findById: vi.fn(),
      findByIdWithRelations: vi.fn(),
      findByBarberAndDate: vi.fn().mockResolvedValue([]),
      findByClient: vi.fn(),
      createTransactional: vi.fn(),
      rescheduleTransactional: vi.fn(),
      updateStatus: vi.fn(),
      getFinanceReport: vi.fn(),
      getBarberPerformanceReport: vi.fn(),
      getAdminCalendarMetrics: vi.fn(),
      getBarberMonthOccupancy: vi.fn(),
      getAdminDashboardMetrics: vi.fn(),
      getBarberDetailedMetrics: vi.fn(),
    };

    serviceRepo = {
      findById: vi.fn().mockResolvedValue(mockService),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
  });

  describe('GetBarberAvailabilityUseCase', () => {
    it('should calculate free slots correctly for a work day', async () => {
      const useCase = new GetBarberAvailabilityUseCase(barberRepo, appointmentRepo, serviceRepo);
      // June 14, 2027 is a Monday (weekday 1)
      const testDate = new Date('2027-06-14T12:00:00');
      
      const slots = await useCase.execute({
        barberId: 'barber-1',
        date: testDate,
        serviceId: 'service-1',
      });

      // 9:00 to 18:00 is 9 hours = 18 slots of 30 mins
      expect(slots.length).toBe(18);
      expect(slots[0].time).toBe('09:00');
      expect(slots[0].available).toBe(true);
    });

    it('should return empty slots if date is not a working day', async () => {
      const useCase = new GetBarberAvailabilityUseCase(barberRepo, appointmentRepo, serviceRepo);
      // June 13, 2027 is a Sunday (weekday 0) which is not in mockBarber.workDays
      const testDate = new Date('2027-06-13T12:00:00');

      const slots = await useCase.execute({
        barberId: 'barber-1',
        date: testDate,
        serviceId: 'service-1',
      });

      expect(slots.length).toBe(0);
    });
  });

  describe('CreateAppointmentUseCase', () => {
    it('should throw an error if booking is outside working hours', async () => {
      const useCase = new CreateAppointmentUseCase(appointmentRepo, serviceRepo, barberRepo);
      // Book at 08:00 AM (workStart is 09:00 AM) on future weekday Monday June 14, 2027
      const bookingTime = new Date('2027-06-14T08:00:00');

      await expect(
        useCase.execute({
          clientId: 'client-1',
          barberId: 'barber-1',
          serviceId: 'service-1',
          startTime: bookingTime,
        })
      ).rejects.toThrow('Appointment time is outside of barber working hours');
    });

    it('should throw 409 Conflict if transactional booking returns null (occupied)', async () => {
      // Mock repository to simulate conflict
      appointmentRepo.createTransactional = vi.fn().mockResolvedValue(null);

      const useCase = new CreateAppointmentUseCase(appointmentRepo, serviceRepo, barberRepo);
      const bookingTime = new Date('2027-06-14T10:00:00');

      try {
        await useCase.execute({
          clientId: 'client-1',
          barberId: 'barber-1',
          serviceId: 'service-1',
          startTime: bookingTime,
        });
        // should fail if it doesn't throw
        expect(true).toBe(false);
      } catch (error: unknown) {
        const err = error as Error & { status?: number };
        expect(err.status).toBe(409);
        expect(err.message).toBe('The requested time slot is no longer available');
      }
    });
  });

  describe('ChangeAppointmentStatusUseCase', () => {
    it('should throw error if attempting to modify COMPLETED appointment as a Barber (Immutable)', async () => {
      const mockAppointment = {
        id: 'app-1',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: new Date(),
        endTime: new Date(),
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      appointmentRepo.findById = vi.fn().mockResolvedValue(mockAppointment);

      const useCase = new ChangeAppointmentStatusUseCase(appointmentRepo);

      await expect(
        useCase.execute({
          appointmentId: 'app-1',
          newStatus: 'CANCELED',
          userId: 'user-barber-1',
          userRole: 'BARBER',
        })
      ).rejects.toThrow('This appointment is COMPLETED and can only be modified by an administrator');
    });

    it('should allow modifying COMPLETED appointment as an ADMIN', async () => {
      const mockAppointment = {
        id: 'app-1',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: new Date(),
        endTime: new Date(),
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      appointmentRepo.findById = vi.fn().mockResolvedValue(mockAppointment);
      appointmentRepo.updateStatus = vi.fn().mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELED',
      });

      const useCase = new ChangeAppointmentStatusUseCase(appointmentRepo);

      const result = await useCase.execute({
        appointmentId: 'app-1',
        newStatus: 'CANCELED',
        userId: 'admin-id',
        userRole: 'ADMIN',
      });

      expect(result.status).toBe('CANCELED');
      expect(appointmentRepo.updateStatus).toHaveBeenCalledWith('app-1', 'CANCELED');
    });

    it('should throw error when changing status to NO_SHOW before appointment startTime (Premature NO_SHOW)', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000 * 24); // Tomorrow
      const mockAppointment = {
        id: 'app-future',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 1800 * 1000),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      appointmentRepo.findById = vi.fn().mockResolvedValue(mockAppointment);

      const useCase = new ChangeAppointmentStatusUseCase(appointmentRepo);

      await expect(
        useCase.execute({
          appointmentId: 'app-future',
          newStatus: 'NO_SHOW',
          userId: 'user-barber-1',
          userRole: 'BARBER',
        })
      ).rejects.toThrow("Não é possível marcar como 'Não compareceu' antes do horário agendado.");
    });

    it('should throw error when attempting to modify an already CANCELED appointment (State Transition Lock)', async () => {
      const mockAppointment = {
        id: 'app-canceled',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: new Date(),
        endTime: new Date(),
        status: 'CANCELED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      appointmentRepo.findById = vi.fn().mockResolvedValue(mockAppointment);

      const useCase = new ChangeAppointmentStatusUseCase(appointmentRepo);

      await expect(
        useCase.execute({
          appointmentId: 'app-canceled',
          newStatus: 'COMPLETED',
          userId: 'user-barber-1',
          userRole: 'BARBER',
        })
      ).rejects.toThrow("Operação inválida: Este agendamento já foi cancelado e não pode sofrer novas alterações.");
    });
  });

  describe('GetAdminDashboardMetricsUseCase', () => {
    it('should execute successfully when requester is ADMIN and dates are valid', async () => {
      const mockReport = {
        totalRevenue: 1500,
        completedCount: 30,
        canceledCount: 2,
        newClientsCount: 5,
        growthPercentage: '+15.4%',
        revenueByTime: [{ timeLabel: '2026-07-01', revenue: 1500, completed: 30 }],
        servicesDistribution: [{ name: 'Corte', value: 30, percentage: 100, fill: '#10b981' }],
      };

      appointmentRepo.getAdminDashboardMetrics = vi.fn().mockResolvedValue(mockReport);
      const useCase = new GetAdminDashboardMetricsUseCase(appointmentRepo);

      const result = await useCase.execute({
        requesterRole: 'ADMIN',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });

      expect(result).toEqual(mockReport);
      expect(appointmentRepo.getAdminDashboardMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        undefined
      );
    });

    it('should throw error when requester is not ADMIN', async () => {
      const useCase = new GetAdminDashboardMetricsUseCase(appointmentRepo);

      await expect(
        useCase.execute({
          requesterRole: 'BARBER',
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-31'),
        })
      ).rejects.toThrow('Acesso negado. Apenas administradores podem acessar o painel analítico de alta densidade.');
    });

    it('should throw error when startDate >= endDate', async () => {
      const useCase = new GetAdminDashboardMetricsUseCase(appointmentRepo);

      await expect(
        useCase.execute({
          requesterRole: 'ADMIN',
          startDate: new Date('2026-07-31'),
          endDate: new Date('2026-07-01'),
        })
      ).rejects.toThrow('A data inicial deve ser anterior à data final.');
    });
  });

  describe('RescheduleAppointmentUseCase', () => {
    it('should reschedule successfully when valid', async () => {
      const useCase = new RescheduleAppointmentUseCase(appointmentRepo, serviceRepo, barberRepo);
      const existing = {
        id: 'app-1',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        status: 'CONFIRMED',
        startTime: new Date(Date.now() + 86400000), // tomorrow
        endTime: new Date(Date.now() + 86400000 + 1800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(appointmentRepo.findById).mockResolvedValue(existing as any);
      vi.mocked(serviceRepo.findById).mockResolvedValue(mockService as any);
      vi.mocked(barberRepo.findById).mockResolvedValue(mockBarber as any);

      // Pick next Wednesday at 14:00 (-03:00) to ensure valid workday and working hours
      const nextWednesday = new Date('2026-07-29T14:00:00.000-03:00');
      vi.mocked(appointmentRepo.rescheduleTransactional).mockResolvedValue({
        ...existing,
        startTime: nextWednesday,
      } as any);

      const res = await useCase.execute({
        appointmentId: 'app-1',
        clientId: 'client-1',
        newStartTime: nextWednesday,
      });

      expect(res.startTime).toEqual(nextWednesday);
      expect(appointmentRepo.rescheduleTransactional).toHaveBeenCalledWith(
        'app-1',
        nextWednesday,
        expect.any(Date),
        ['PENDING', 'COMPLETED']
      );
    });

    it('should throw error if appointment past or not active', async () => {
      const useCase = new RescheduleAppointmentUseCase(appointmentRepo, serviceRepo, barberRepo);
      const existing = {
        id: 'app-1',
        clientId: 'client-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        status: 'CANCELED',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 1800000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(appointmentRepo.findById).mockResolvedValue(existing as any);

      await expect(
        useCase.execute({
          appointmentId: 'app-1',
          clientId: 'client-1',
          newStartTime: new Date('2026-07-29T14:00:00.000-03:00'),
        })
      ).rejects.toThrow('Apenas agendamentos ativos podem ser reagendados.');
    });
  });
});


