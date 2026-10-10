export interface User {
  id: string; name: string | null; email: string; emailVerified: Date | null;
  image: string | null; passwordHash: string | null; phone: string | null;
  role: string; active: boolean; createdAt: Date; updatedAt: Date;
}
export interface Barber {
  id: string; userId: string; workDays: number[]; workStart: string; workEnd: string;
  createdAt: Date; updatedAt: Date;
}
export interface Service {
  id: string; name: string; price: number; commissionRate: number;
  durationMinutes: number; image: string | null; active: boolean;
  createdAt: Date; updatedAt: Date;
}
export interface Appointment {
  id: string; clientId: string; barberId: string; serviceId: string;
  startTime: Date; endTime: Date; status: string;
  priceCents: number; commissionCents: number;
  reminded24h: boolean; reminded1h: boolean; reminded15m: boolean; remindedStart: boolean;
  createdAt: Date; updatedAt: Date;
}
