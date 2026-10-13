import { Appointment } from '@/core/domain/models';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { BarberRepository } from '../domain/repositories/BarberRepository';
import { ClientContactRepository } from '../domain/repositories/ClientContactRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { getLocalDayOfWeek, getLocalHoursMinutes } from '../utils/date-utils';

export interface CreateManualCustomerData {
  type: 'REGISTERED' | 'NEW_CONTACT' | 'EXISTING_CONTACT';
  clientId?: string;
  contactId?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface CreateManualAppointmentRequest {
  operatorUserId: string;
  operatorRole: string;
  customer: CreateManualCustomerData;
  origin: 'WHATSAPP' | 'WALK_IN';
  barberId: string;
  serviceId: string;
  startTime: Date;
}

export class CreateManualAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private serviceRepository: ServiceRepository,
    private barberRepository: BarberRepository,
    private clientContactRepository: ClientContactRepository
  ) {}

  async execute(request: CreateManualAppointmentRequest): Promise<Appointment> {
    const { operatorUserId, operatorRole, customer, origin, barberId, serviceId, startTime } = request;

    // 1. Autorização estrita: apenas RECEPTIONIST
    if (operatorRole !== 'RECEPTIONIST') {
      throw new Error('Acesso negado: a criação de agendamento manual para terceiros é exclusiva da atendente autenticada.');
    }

    if (!operatorUserId) {
      throw new Error('Identificação da atendente ausente.');
    }

    // 2. Validação da Origem
    if (!['WHATSAPP', 'WALK_IN'].includes(origin)) {
      throw new Error('Origem da reserva manual inválida. Escolha WhatsApp ou Presencial.');
    }

    // 3. Validação do Cliente / Contato
    let clientId: string | null = null;
    let clientContactId: string | null = null;

    if (customer.type === 'REGISTERED') {
      if (!customer.clientId) {
        throw new Error('Identificador do cliente cadastrado é obrigatório.');
      }
      clientId = customer.clientId;
    } else if (customer.type === 'EXISTING_CONTACT') {
      if (!customer.contactId) {
        throw new Error('Identificador do contato existente é obrigatório.');
      }
      const existing = await this.clientContactRepository.findById(customer.contactId);
      if (!existing) {
        throw new Error('Contato não encontrado no cadastro da recepção.');
      }
      clientContactId = existing.id;
    } else if (customer.type === 'NEW_CONTACT') {
      const name = (customer.name || '').trim();
      if (!name || name.length < 2) {
        throw new Error('Nome do cliente é obrigatório (mínimo de 2 caracteres).');
      }

      const phone = (customer.phone || '').trim();
      if (origin === 'WHATSAPP') {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) {
          throw new Error('Telefone com DDD é obrigatório para reservas com origem WhatsApp.');
        }
      }

      const contact = await this.clientContactRepository.create({
        name,
        phone: phone || null,
        email: customer.email?.trim() || null,
      });
      clientContactId = contact.id;
    } else {
      throw new Error('Tipo de cliente inválido.');
    }

    // 4. Validação de data/hora (não permitir passado)
    if (startTime < new Date()) {
      throw new Error('Não é possível criar agendamentos em horários passados.');
    }

    // 5. Validação de Serviço ativo
    const service = await this.serviceRepository.findById(serviceId);
    if (!service || !service.active) {
      throw new Error('Serviço indisponível ou inativo.');
    }

    // 6. Validação de Barbeiro ativo e expediente
    const barber = await this.barberRepository.findById(barberId);
    if (!barber || !barber.user.active) {
      throw new Error('Profissional indisponível ou inativo.');
    }

    const dayOfWeek = getLocalDayOfWeek(startTime);
    if (!barber.workDays.includes(dayOfWeek)) {
      throw new Error('O profissional não atende no dia da semana selecionado.');
    }

    const [startHour, startMin] = barber.workStart.split(':').map(Number);
    const [endHour, endMin] = barber.workEnd.split(':').map(Number);
    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    const { hours: startH, minutes: startM } = getLocalHoursMinutes(startTime);
    const appStartMinutes = startH * 60 + startM;
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);
    const appEndMinutes = appStartMinutes + service.durationMinutes;

    if (appStartMinutes < workStartMinutes || appEndMinutes > workEndMinutes) {
      throw new Error('Horário fora do expediente de trabalho do profissional.');
    }

    // 7. Criação transacional protegida com lock de barbeiro
    const conflictingStatuses = ['PENDING', 'COMPLETED'];
    const appointment = await this.appointmentRepository.createTransactional(
      {
        clientId,
        clientContactId,
        barberId,
        serviceId,
        startTime,
        endTime,
        origin,
        createdById: operatorUserId,
      },
      conflictingStatuses
    );

    if (!appointment) {
      const error = new Error('O horário selecionado acabou de ser reservado por outro cliente. Escolha outro horário.') as Error & { status?: number };
      error.status = 409;
      throw error;
    }

    return appointment;
  }
}
