export type CalendarView = "day" | "month" | "year";
export type CalendarContext = "agenda" | "cash";
export type CalendarStatus =
  | "all"
  | "PENDING"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW";
export type CalendarPayment = "all" | "paid" | "unpaid";
export interface CalendarFilters {
  barberId?: string;
  status?: CalendarStatus;
  payment?: CalendarPayment;
  context?: CalendarContext;
}
export interface CalendarSummary {
  count: number;
  pending: number;
  completed: number;
  canceled: number;
  noShow: number;
  realizedCents: number;
  receivedCents: number;
  unpaidCents: number;
  reservedMinutes: number;
}
export interface CalendarBucket extends CalendarSummary {
  date: string;
}
export interface CalendarAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  clientType: "REGISTERED" | "CONTACT";
  barberId: string;
  barberName: string;
  barberActive: boolean;
  serviceName: string;
  origin: string;
  priceCents: number;
  commissionCents: number;
  paymentStatus: "CONFIRMED" | "REVERSED" | "UNCONFIRMED";
  confirmedAt: string | null;
  receivedCents: number;
  paymentMethod: string | null;
}
export interface AdminCalendarResult {
  buckets: CalendarBucket[];
  summary: CalendarSummary;
  appointments: CalendarAppointment[];
  startDate: string;
  endDate: string;
  context: CalendarContext;
}
