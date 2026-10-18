import type {
  BookingOriginFilter,
  InsightComparisonMode,
  InsightPeriod,
  PaymentMethodFilter,
} from "@/core/domain/repositories/AdminInsightsRepository";

export interface AnalyticsReport {
  totalRevenue: number;
  completedCount: number;
  canceledCount: number;
  noShowCount?: number;
  newClientsCount: number;
  growthPercentage: string;
  growthTrend?: "up" | "down" | "neutral" | "no_basis";
  revenueByTime: { timeLabel: string; revenue: number; completed: number }[];
  servicesDistribution: {
    name: string;
    value: number;
    revenue?: number;
    percentage: number;
    fill: string;
  }[];
  periodLabel?: string;
}

export interface AdminBarberProp {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  workDays: number[];
  workStart: string;
  workEnd: string;
  active?: boolean;
  specialty?: string;
}

export interface AdminServiceProp {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  commissionRate: number;
  active: boolean;
}

export type DashboardPeriod = InsightPeriod;

export interface DashboardFilterState {
  period: InsightPeriod;
  customStart: string;
  customEnd: string;
  compareMode: InsightComparisonMode;
  compareStart: string;
  compareEnd: string;
  barberIds: string[];
  serviceIds: string[];
  origins: BookingOriginFilter[];
  paymentMethods: PaymentMethodFilter[];
}

