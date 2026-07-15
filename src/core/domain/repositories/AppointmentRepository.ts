import { Appointment, Service, User } from '@/generated/prisma/client';

export type AppointmentWithRelations = Appointment & {
  client: User;
  service: Service;
};

export interface BarberCommission {
  barberId: string;
  barberName: string;
  commission: number;
}

export interface FinanceReport {
  grossRevenue: number;
  netRevenue: number;
  barbersCommissions: BarberCommission[];
}

export interface BarberPerformanceReport {
  chartData: { date: string; count: number; revenue: number }[];
  topServices: { name: string; count: number; revenue: number }[];
}

export interface CalendarMetric {
  date: string; // YYYY-MM (for year view) or YYYY-MM-DD (for month view)
  count: number;
  revenue?: number;
  completed_count?: number;
  pending_count?: number;
  canceled_count?: number;
  no_show_count?: number;
}

export interface DayAppointmentDetail {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  clientName: string;
  clientEmail: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
}

export interface AdminCalendarDayResult {
  date: string;
  appointments: DayAppointmentDetail[];
}

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null>;
  findByBarberAndDate(barberId: string, startOfDay: Date, endOfDay: Date): Promise<Appointment[]>;
  findByClient(clientId: string): Promise<Appointment[]>;
  createTransactional(
    data: {
      clientId: string;
      barberId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
    },
    conflictingStatuses: string[]
  ): Promise<Appointment | null>;
  updateStatus(id: string, status: string): Promise<Appointment>;
  getFinanceReport(startDate?: Date, endDate?: Date): Promise<FinanceReport>;
  getBarberPerformanceReport(barberId: string, startDate?: Date, endDate?: Date): Promise<BarberPerformanceReport>;
  getAdminCalendarMetrics(year: number, month?: number, day?: number): Promise<{ metrics: CalendarMetric[]; dayDetails?: AdminCalendarDayResult }>;
  getBarberMonthOccupancy(barberId: string, year: number, month: number): Promise<{ date: string; count: number }[]>;
}
