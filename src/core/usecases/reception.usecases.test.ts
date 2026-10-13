import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment, ClientContact, PaymentReceipt, PaymentReversal } from '../domain/models';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { ClientContactRepository } from '../domain/repositories/ClientContactRepository';
import { PaymentReceiptRepository } from '../domain/repositories/PaymentReceiptRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { ConfirmPaymentReceiptUseCase } from './ConfirmPaymentReceiptUseCase';
import { CreateManualAppointmentUseCase } from './CreateManualAppointmentUseCase';
import { RevertPaymentReceiptUseCase } from './RevertPaymentReceiptUseCase';

describe('Reception and Cash Register Use Cases', () => {
  const mockBarber = {
    id: 'barber-1',
    userId: 'user-barber-1',
    workDays: [1, 2, 3, 4, 5], // Seg a Sex
    workStart: '08:00',
    workEnd: '18:00',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-barber-1',
      name: 'Barbeiro Teste',
      email: 'barber@test.com',
      emailVerified: null,
      image: null,
      passwordHash: 'hash',
      role: 'BARBER',
      active: true,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockService = {
    id: 'service-1',
    name: 'Corte Social',
    price: 45.0,
    active: true,
    image: null,
    durationMinutes: 30,
    commissionRate: 0.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
  });

  describe('CreateManualAppointmentUseCase', () => {
    let apptRepo: AppointmentRepository;
    let serviceRepo: ServiceRepository;
    let barberRepo: BarberRepository;
    let contactRepo: ClientContactRepository;

    beforeEach(() => {
      apptRepo = {
        findById: vi.fn(),
        findByIdWithRelations: vi.fn(),
        findByBarberAndDate: vi.fn().mockResolvedValue([]),
        findByClient: vi.fn(),
        createTransactional: vi.fn().mockImplementation((data) =>
          Promise.resolve({
            id: 'appt-123',
            ...data,
            status: 'CONFIRMED',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Appointment)
        ),
        rescheduleTransactional: vi.fn(),
        updateStatus: vi.fn(),
      };

      serviceRepo = {
        findAll: vi.fn(),
        findById: vi.fn().mockResolvedValue(mockService),
        create: vi.fn(),
        update: vi.fn(),
      };

      barberRepo = {
        findById: vi.fn().mockResolvedValue(mockBarber),
        findByUserId: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn(),
        getBarberSpecialty: vi.fn(),
      };

      contactRepo = {
        findById: vi.fn(),
        search: vi.fn(),
        create: vi.fn().mockImplementation((data) =>
          Promise.resolve({
            id: 'contact-999',
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ClientContact)
        ),
      };
    });

    it('should reject manual booking if operator role is not RECEPTIONIST', async () => {
      const useCase = new CreateManualAppointmentUseCase(apptRepo, serviceRepo, barberRepo, contactRepo);

      await expect(
        useCase.execute({
          operatorUserId: 'user-admin',
          operatorRole: 'ADMIN',
          customer: { type: 'NEW_CONTACT', name: 'João Silva', phone: '11988887777' },
          origin: 'WHATSAPP',
          barberId: 'barber-1',
          serviceId: 'service-1',
          startTime: new Date('2026-10-14T14:00:00Z'),
        })
      ).rejects.toThrow(/exclusiva da atendente/i);

      await expect(
        useCase.execute({
          operatorUserId: 'user-client',
          operatorRole: 'CLIENT',
          customer: { type: 'NEW_CONTACT', name: 'João Silva', phone: '11988887777' },
          origin: 'WHATSAPP',
          barberId: 'barber-1',
          serviceId: 'service-1',
          startTime: new Date('2026-10-14T14:00:00Z'),
        })
      ).rejects.toThrow(/exclusiva da atendente/i);
    });

    it('should require a valid phone number for WHATSAPP origin', async () => {
      const useCase = new CreateManualAppointmentUseCase(apptRepo, serviceRepo, barberRepo, contactRepo);

      await expect(
        useCase.execute({
          operatorUserId: 'receptionist-1',
          operatorRole: 'RECEPTIONIST',
          customer: { type: 'NEW_CONTACT', name: 'João Silva', phone: '123' },
          origin: 'WHATSAPP',
          barberId: 'barber-1',
          serviceId: 'service-1',
          startTime: new Date('2026-10-14T14:00:00Z'),
        })
      ).rejects.toThrow(/telefone com ddd é obrigatório/i);
    });

    it('should create new client contact and appointment for non-registered customer', async () => {
      const useCase = new CreateManualAppointmentUseCase(apptRepo, serviceRepo, barberRepo, contactRepo);

      const result = await useCase.execute({
        operatorUserId: 'receptionist-1',
        operatorRole: 'RECEPTIONIST',
        customer: { type: 'NEW_CONTACT', name: 'Maria Souza', phone: '11999998888' },
        origin: 'WHATSAPP',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: new Date('2026-10-14T14:00:00Z'),
      });

      expect(contactRepo.create).toHaveBeenCalledWith({
        name: 'Maria Souza',
        phone: '11999998888',
        email: null,
      });

      expect(apptRepo.createTransactional).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'WHATSAPP',
          createdById: 'receptionist-1',
          clientContactId: 'contact-999',
          clientId: null,
          barberId: 'barber-1',
          serviceId: 'service-1',
        }),
        ['PENDING', 'COMPLETED']
      );
      expect(result.id).toBe('appt-123');
    });

    it('should link registered client directly when type is REGISTERED', async () => {
      const useCase = new CreateManualAppointmentUseCase(apptRepo, serviceRepo, barberRepo, contactRepo);

      const result = await useCase.execute({
        operatorUserId: 'receptionist-1',
        operatorRole: 'RECEPTIONIST',
        customer: { type: 'REGISTERED', clientId: 'registered-client-42' },
        origin: 'WALK_IN',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: new Date('2026-10-14T15:00:00Z'),
      });

      expect(contactRepo.create).not.toHaveBeenCalled();
      expect(apptRepo.createTransactional).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'WALK_IN',
          createdById: 'receptionist-1',
          clientId: 'registered-client-42',
          clientContactId: null,
        }),
        ['PENDING', 'COMPLETED']
      );
      expect(result.id).toBe('appt-123');
    });
  });

  describe('ConfirmPaymentReceiptUseCase', () => {
    let receiptRepo: PaymentReceiptRepository;

    beforeEach(() => {
      receiptRepo = {
        findById: vi.fn(),
        findByAppointmentId: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        confirmPayment: vi.fn().mockImplementation((data) =>
          Promise.resolve({
            id: 'receipt-1',
            appointmentId: data.appointmentId,
            amountCents: 4500,
            method: data.method,
            status: 'CONFIRMED',
            confirmedById: data.confirmedById,
            idempotencyKey: data.idempotencyKey,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as PaymentReceipt)
        ),
        revertPayment: vi.fn(),
        getPendingAppointments: vi.fn(),
        getConfirmedReceiptsForDay: vi.fn(),
        getCashRegisterSummary: vi.fn(),
      };
    });

    it('should deny confirmation for unauthorized roles', async () => {
      const useCase = new ConfirmPaymentReceiptUseCase(receiptRepo);

      await expect(
        useCase.execute({
          appointmentId: 'appt-1',
          method: 'MONEY',
          operatorUserId: 'barber-1',
          operatorRole: 'BARBER',
        })
      ).rejects.toThrow(/acesso negado/i);

      await expect(
        useCase.execute({
          appointmentId: 'appt-1',
          method: 'MONEY',
          operatorUserId: 'client-1',
          operatorRole: 'CLIENT',
        })
      ).rejects.toThrow(/acesso negado/i);
    });

    it('should reject invalid payment methods', async () => {
      const useCase = new ConfirmPaymentReceiptUseCase(receiptRepo);

      await expect(
        useCase.execute({
          appointmentId: 'appt-1',
          method: 'BITCOIN',
          operatorUserId: 'rec-1',
          operatorRole: 'RECEPTIONIST',
        })
      ).rejects.toThrow(/forma de pagamento inválida/i);
    });

    it('should confirm payment for RECEPTIONIST or ADMIN with valid method', async () => {
      const useCase = new ConfirmPaymentReceiptUseCase(receiptRepo);

      const receipt = await useCase.execute({
        appointmentId: 'appt-1',
        method: 'PIX',
        operatorUserId: 'rec-1',
        operatorRole: 'RECEPTIONIST',
        idempotencyKey: 'key-123',
      });

      expect(receiptRepo.confirmPayment).toHaveBeenCalledWith({
        appointmentId: 'appt-1',
        method: 'PIX',
        confirmedById: 'rec-1',
        idempotencyKey: 'key-123',
      });
      expect(receipt.status).toBe('CONFIRMED');
      expect(receipt.amountCents).toBe(4500);
    });
  });

  describe('RevertPaymentReceiptUseCase', () => {
    let receiptRepo: PaymentReceiptRepository;

    beforeEach(() => {
      receiptRepo = {
        findById: vi.fn(),
        findByAppointmentId: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        confirmPayment: vi.fn(),
        revertPayment: vi.fn().mockImplementation((data) =>
          Promise.resolve({
            id: 'rev-1',
            receiptId: data.receiptId,
            reason: data.reason,
            revertedById: data.revertedById,
            createdAt: new Date(),
          } as PaymentReversal)
        ),
        getPendingAppointments: vi.fn(),
        getConfirmedReceiptsForDay: vi.fn(),
        getCashRegisterSummary: vi.fn(),
      };
    });

    it('should deny payment reversal for RECEPTIONIST and non-admin roles', async () => {
      const useCase = new RevertPaymentReceiptUseCase(receiptRepo);

      await expect(
        useCase.execute({
          receiptId: 'receipt-1',
          reason: 'Cliente cancelou e pediu estorno',
          operatorUserId: 'rec-1',
          operatorRole: 'RECEPTIONIST',
        })
      ).rejects.toThrow(/exclusiva do administrador/i);
    });

    it('should require a valid audit reason', async () => {
      const useCase = new RevertPaymentReceiptUseCase(receiptRepo);

      await expect(
        useCase.execute({
          receiptId: 'receipt-1',
          reason: '   ',
          operatorUserId: 'admin-1',
          operatorRole: 'ADMIN',
        })
      ).rejects.toThrow(/motivo da reversão é obrigatório/i);
    });

    it('should successfully execute reversal when caller is ADMIN with reason', async () => {
      const useCase = new RevertPaymentReceiptUseCase(receiptRepo);

      const reversal = await useCase.execute({
        receiptId: 'receipt-1',
        reason: 'Lançamento em duplicidade por engano no caixa',
        operatorUserId: 'admin-1',
        operatorRole: 'ADMIN',
      });

      expect(receiptRepo.revertPayment).toHaveBeenCalledWith({
        receiptId: 'receipt-1',
        reason: 'Lançamento em duplicidade por engano no caixa',
        revertedById: 'admin-1',
      });
      expect(reversal.id).toBe('rev-1');
      expect(reversal.receiptId).toBe('receipt-1');
    });
  });
});
