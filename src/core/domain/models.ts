export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barber {
  id: string;
  userId: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receptionist {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  durationMinutes: number;
  image: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentOrigin = 'ONLINE' | 'WHATSAPP' | 'WALK_IN';

export interface Appointment {
  id: string;
  clientId: string | null;
  clientContactId?: string | null;
  barberId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  origin?: AppointmentOrigin | string;
  createdById?: string | null;
  priceCents: number;
  commissionCents: number;
  reminded24h: boolean;
  reminded1h: boolean;
  reminded15m: boolean;
  remindedStart: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'MONEY' | 'PIX' | 'CARD';
export type PaymentReceiptStatus = 'CONFIRMED' | 'REVERSED';

export interface PaymentReceipt {
  id: string;
  appointmentId: string;
  amountCents: number;
  method: PaymentMethod | string;
  confirmedById: string;
  confirmedAt: Date;
  idempotencyKey?: string | null;
  status: PaymentReceiptStatus | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReversal {
  id: string;
  receiptId: string;
  reason: string;
  revertedById: string;
  revertedAt: Date;
  createdAt: Date;
}
