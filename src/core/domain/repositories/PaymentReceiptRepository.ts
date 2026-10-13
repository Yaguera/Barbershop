import { PaymentMethod, PaymentReceipt, PaymentReversal } from '../models';

export interface PendingAppointmentItem {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientId: string | null;
  clientContactId?: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  startTime: Date;
  endTime: Date;
  priceCents: number;
  origin: string;
}

export interface ConfirmedReceiptItem {
  id: string;
  appointmentId: string;
  amountCents: number;
  method: PaymentMethod | string;
  confirmedById: string;
  confirmedByName: string;
  confirmedAt: Date;
  status: string;
  clientName: string;
  serviceName: string;
  barberName: string;
  serviceStartTime: Date;
}

export interface CashRegisterSummary {
  receivedTodayCents: number;
  receivedTodayCount: number;
  totalPendingCents: number;
  totalPendingCount: number;
  byMethodCents: {
    money: number;
    pix: number;
    card: number;
  };
}

export interface PaymentReceiptRepository {
  findById(id: string): Promise<PaymentReceipt | null>;
  findByAppointmentId(appointmentId: string): Promise<PaymentReceipt | null>;
  findByIdempotencyKey(key: string): Promise<PaymentReceipt | null>;
  confirmPayment(data: {
    appointmentId: string;
    method: PaymentMethod | string;
    confirmedById: string;
    idempotencyKey?: string | null;
  }): Promise<PaymentReceipt>;
  revertPayment(data: {
    receiptId: string;
    reason: string;
    revertedById: string;
  }): Promise<PaymentReversal>;
  getPendingAppointments(barberId?: string): Promise<PendingAppointmentItem[]>;
  getConfirmedReceiptsForDay(date: Date, barberId?: string): Promise<ConfirmedReceiptItem[]>;
  getCashRegisterSummary(date: Date): Promise<CashRegisterSummary>;
}
