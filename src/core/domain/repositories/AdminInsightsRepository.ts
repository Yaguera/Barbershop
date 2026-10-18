export type InsightPeriod =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "prev_month"
  | "year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "custom"
  | "all";

export type InsightComparisonMode =
  | "none"
  | "prev_period"
  | "yoy"
  | "custom";

export type BookingOriginFilter = "ONLINE" | "WHATSAPP" | "WALK_IN";
export type PaymentMethodFilter = "MONEY" | "PIX" | "CARD";

export type InsightKind =
  | "completed"
  | "received"
  | "pending"
  | "canceled"
  | "no_show";

export interface InsightFilterInput {
  period: InsightPeriod;
  customStart?: string;
  customEnd?: string;
  compareMode?: InsightComparisonMode;
  compareStart?: string;
  compareEnd?: string;
  barberId?: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: BookingOriginFilter[];
  paymentMethods?: PaymentMethodFilter[];
}

export interface InsightRange {
  startDate: Date;
  endDate: Date;
  period?: InsightPeriod;
  barberId?: string;
  barberIds?: string[];
  serviceIds?: string[];
  origins?: BookingOriginFilter[];
  paymentMethods?: PaymentMethodFilter[];
  compareMode?: InsightComparisonMode;
  compareStartDate?: Date;
  compareEndDate?: Date;
  comparisonNote?: string;
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
  method?: string;
  count?: number;
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

export interface BarberServiceCell {
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  completed: number;
  realizedCents: number;
  commissionCents: number;
  contributionCents: number;
  effectiveCommissionRate: number;
  shareOfBarberRate: number;
  shareOfTotalRate: number;
}

export interface PaymentMethodInsight {
  method: PaymentMethodFilter | string;
  label: string;
  count: number;
  amountCents: number;
  percentage: number;
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
  commissionCents?: number;
  contributionCents?: number;
  percentage: number;
}

export type DeltaState =
  | "positive"
  | "negative"
  | "neutral"
  | "no_percent_base"
  | "no_movement";

export type MetricPolarity =
  | "higher_is_better"
  | "lower_is_better"
  | "neutral";

export interface MetricComparisonDelta {
  current: number;
  reference: number;
  absoluteDelta: number;
  percentDelta: number | null;
  pointsDelta: number | null;
  state: DeltaState;
  favorable: boolean | null;
  formattedReference: string;
  formattedDelta: string;
}

export interface InsightComparisonSummary {
  mode: InsightComparisonMode;
  startDate: string;
  endDate: string;
  periodLabel: string;
  equivalenceNote?: string;
  metrics: {
    receivedCents: MetricComparisonDelta;
    realizedCents: MetricComparisonDelta;
    pendingCents: MetricComparisonDelta;
    commissionCents: MetricComparisonDelta;
    contributionCents: MetricComparisonDelta;
    effectiveCommissionRate: MetricComparisonDelta;
    completed: MetricComparisonDelta;
    averageServiceTicketCents: MetricComparisonDelta;
    clients: MetricComparisonDelta;
    averageVisitTicketCents: MetricComparisonDelta;
    cohortReceiptRate: MetricComparisonDelta;
    canceled: MetricComparisonDelta;
    noShow: MetricComparisonDelta;
  };
  timeline: TimelinePoint[];
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
  barberServiceMatrix: BarberServiceCell[];
  paymentMethods: PaymentMethodInsight[];
  topClients: ClientInsight[];
  services: ServiceInsight[];
  comparison?: InsightComparisonSummary | null;
  appliedFilters?: {
    barberIds: string[];
    serviceIds: string[];
    origins: BookingOriginFilter[];
    paymentMethods: PaymentMethodFilter[];
  };
}

export interface InsightDetailFilter {
  period: InsightPeriod;
  kind: InsightKind;
  customStart?: string;
  customEnd?: string;
  startDate?: string;
  endDate?: string;
  barberId?: string;
  barberIds?: string[];
  serviceId?: string;
  serviceIds?: string[];
  origins?: BookingOriginFilter[];
  paymentMethods?: PaymentMethodFilter[];
  clientId?: string;
  clientType?: "REGISTERED" | "CONTACT";
  page?: number;
}

export interface InsightDetailRow {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  barberId?: string;
  barberName: string;
  serviceId?: string;
  serviceName: string;
  status: string;
  origin?: string;
  paid: boolean;
  paymentMethod?: string | null;
  confirmedAt: string | null;
  priceCents: number;
  commissionCents: number;
  contributionCents?: number;
  amountCents: number;
}

export interface InsightDetails {
  rows: InsightDetailRow[];
  total: number;
  amountCents: number;
  priceCents?: number;
  commissionCents?: number;
  contributionCents?: number;
  calculatedAt?: string;
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

