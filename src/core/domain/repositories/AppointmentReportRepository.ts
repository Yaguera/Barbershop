import type { AdminCalendarResult, CalendarFilters } from './AdminCalendarRepository';
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

export interface AdminDashboardMetricsReport {
  totalRevenue: number;
  totalRealized?: number;
  totalReceived?: number;
  totalPending?: number;
  completedCount: number;
  receivedCount?: number;
  pendingPaymentCount?: number;
  canceledCount: number;
  noShowCount?: number;
  newClientsCount: number;
  growthPercentage: string;
  growthTrend?: 'up' | 'down' | 'neutral' | 'no_basis';
  revenueByTime: { timeLabel: string; revenue: number; completed: number; received?: number }[];
  servicesDistribution: { name: string; value: number; revenue?: number; percentage: number; fill: string }[];
  periodLabel?: string;
}

export interface BarberDetailedMetricsReport {
  totalAppointments: number;
  totalRevenue: number;
  totalCommission?: number;
  commissionBreakdown?: { serviceName: string; priceCents: number; commissionCents: number; count: number }[];
  canceledCount?: number;
  noShowCount?: number;
  dailyRevenueChart: { date: string; revenue: number; count: number }[];
  servicesDistribution: { name: string; count: number; revenue: number; percentage: number; fill: string }[];
  periodLabel?: string;
}

export interface AppointmentReportRepository {
  getFinanceReport(startDate?: Date, endDate?: Date): Promise<FinanceReport>;
  getBarberPerformanceReport(barberId: string, startDate?: Date, endDate?: Date): Promise<BarberPerformanceReport>;
  getBarberDetailedMetrics(barberId: string, startDate: Date, endDate: Date): Promise<BarberDetailedMetricsReport>;
  getAdminCalendarMetrics(year: number, month?: number, day?: number, filters?: CalendarFilters): Promise<AdminCalendarResult>;
  getBarberMonthOccupancy(barberId: string, year: number, month: number): Promise<{ date: string; count: number }[]>;
  getAdminDashboardMetrics(startDate: Date, endDate: Date, barberId?: string): Promise<AdminDashboardMetricsReport>;
}
