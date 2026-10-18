export type InsightPeriod = "today" | "week" | "month" | "year" | "all";
export type InsightKind =
  | "completed"
  | "received"
  | "pending"
  | "canceled"
  | "no_show";
export interface InsightRange {
  startDate: Date;
  endDate: Date;
  barberId?: string;
}
export interface ProductionGroup {
  day: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientKey: string;
  clientName: string;
  clientType: "REGISTERED" | "CONTACT";
  count: number;
  amountCents: number;
  commissionCents: number;
  pendingCents: number;
}
export interface ReceiptGroup {
  day: string;
  barberId: string;
  barberName: string;
  amountCents: number;
}
export interface TimelinePoint {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  realizedCents: number;
  receivedCents: number;
  completed: number;
}
export interface BarberInsight {
  id: string;
  name: string;
  completed: number;
  realizedCents: number;
  receivedCents: number;
  commissionCents: number;
  contributionCents: number;
}
export interface ClientInsight {
  key: string;
  id: string;
  type: "REGISTERED" | "CONTACT";
  name: string;
  visits: number;
  appointments: number;
  realizedCents: number;
  lastVisit: string;
  averageDays: number | null;
}
export interface ServiceInsight {
  id: string;
  name: string;
  count: number;
  amountCents: number;
  percentage: number;
}
export interface AdminInsights {
  startDate: string;
  endDate: string;
  periodLabel: string;
  calculatedAt: string;
  granularity: "day" | "month" | "year";
  realizedCents: number;
  receivedCents: number;
  pendingCents: number;
  commissionCents: number;
  contributionCents: number;
  effectiveCommissionRate: number;
  averageServiceTicketCents: number;
  totalDistinctVisits: number;
  averageVisitTicketCents: number;
  cohortReceiptRate: number;
  completed: number;
  clients: number;
  recurringClients: number;
  canceled: number;
  noShow: number;
  timeline: TimelinePoint[];
  barbers: BarberInsight[];
  topClients: ClientInsight[];
  services: ServiceInsight[];
}
export interface InsightDetailFilter {
  period: InsightPeriod;
  kind: InsightKind;
  startDate?: string;
  endDate?: string;
  barberId?: string;
  serviceId?: string;
  clientId?: string;
  clientType?: "REGISTERED" | "CONTACT";
  page?: number;
}
export interface InsightDetailRow {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  status: string;
  paid: boolean;
  confirmedAt: string | null;
  priceCents: number;
  commissionCents: number;
  amountCents: number;
}
export interface InsightDetails {
  rows: InsightDetailRow[];
  total: number;
  amountCents: number;
  page: number;
  pageSize: number;
}
export interface AdminInsightsRepository {
  overview(range: InsightRange): Promise<AdminInsights>;
  details(
    range: InsightRange,
    filter: InsightDetailFilter,
  ): Promise<InsightDetails>;
}
