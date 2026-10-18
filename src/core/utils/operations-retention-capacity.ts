export interface TimeInterval {
  startMs: number;
  endMs: number;
}

export type ScheduleExceptionKind =
  | "PAUSE"
  | "BLOCK"
  | "VACATION"
  | "EXTRA_SHIFT";

export interface BarberScheduleConfigInput {
  barberId: string;
  barberName: string;
  active: boolean;
  workDays: number[]; // 0 (Sunday) .. 6 (Saturday)
  workStart: string; // "HH:MM"
  workEnd: string; // "HH:MM"
}

export interface ScheduleExceptionInput {
  id: string;
  barberId: string;
  barberName?: string;
  kind: ScheduleExceptionKind;
  startTime: Date;
  endTime: Date;
  reason?: string | null;
}

export interface OperationalAppointmentInput {
  id: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  clientId: string | null;
  clientContactId: string | null;
  clientName: string;
  startTime: Date;
  endTime: Date;
  status: string; // PENDING, COMPLETED, CANCELED, NO_SHOW
  origin: string; // ONLINE, WHATSAPP, WALK_IN
  priceCents: number;
  commissionCents: number;
  cancelReasonCode?: string | null;
}

export interface ClientIdentityLinkInput {
  id: string;
  clientContactId: string;
  contactName?: string;
  canonicalUserId: string;
  canonicalUserName?: string;
  active: boolean;
  linkedAt: Date;
  reason?: string | null;
}

export interface BarberCapacityRow {
  barberId: string;
  barberName: string;
  active: boolean;
  hasConfiguredSchedule: boolean;
  availableMinutes: number;
  scheduledMinutes: number;
  completedMinutes: number;
  canceledMinutes: number;
  reusedCanceledMinutes: number;
  effectivelyLostMinutes: number;
  noShowMinutes: number;
  scheduledOccupancyRate: number | null;
  completedOccupancyRate: number | null;
  completedCount: number;
  canceledCount: number;
  noShowCount: number;
  realizedCents: number;
  commissionCents: number;
  contributionCents: number;
  realizedPerAvailableHourCents: number | null;
  contributionPerOccupiedHourCents: number | null;
  isEstimatedDuration: boolean;
}

export interface HeatmapSlot {
  weekday: number; // 0..6
  weekdayLabel: string;
  hour: number; // 8..20
  availableMinutes: number;
  occupiedMinutes: number;
  occupancyRate: number | null;
}

export interface CancellationBreakdownSummary {
  eligibleTerminalCount: number;
  completedTerminalCount: number;
  canceledTerminalCount: number;
  noShowTerminalCount: number;
  futureExcludedCount: number;
  cancellationRate: number | null;
  noShowRate: number | null;
  totalCanceledMinutes: number;
  reusedCanceledMinutes: number;
  effectivelyLostMinutes: number;
  byReason: {
    reasonCode: string;
    label: string;
    count: number;
  }[];
  byOrigin: {
    origin: string;
    label: string;
    completedCount: number;
    canceledCount: number;
    noShowCount: number;
    lossRate: number | null;
  }[];
}

export interface ClientCohortRow {
  cohortMonth: string; // "YYYY-MM"
  totalNewClients: number;
  matureClientsCount: number;
  immatureClientsCount: number;
  returnedWithin30dCount: number;
  retention30dRate: number | null;
  isMatureCohort: boolean;
  statusNote: string;
}

export interface ClientSegmentDetail {
  canonicalKey: string;
  displayName: string;
  identityType: "USER" | "CONTACT" | "LINKED_USER";
  firstHistoricalVisitDay: string;
  lastHistoricalVisitDay: string;
  visitsInPeriod: number;
  totalHistoricalVisits: number;
  servicesInPeriod: number;
  realizedInPeriodCents: number;
  historicalRealizedCents: number;
  avgReturnIntervalDays: number | null;
  daysSinceLastVisit: number;
}

export interface ClientRetentionSummary {
  activeClientsInPeriodCount: number;
  newClientsInPeriodCount: number;
  returningClientsInPeriodCount: number;
  recurringInPeriodCount: number;
  separateContactIdentitiesCount: number;
  linkedIdentitiesCount: number;
  globalAvgReturnIntervalDays: number | null;
  consolidatedMatureClientsCount: number;
  consolidatedReturned30dCount: number;
  consolidatedRetention30dRate: number | null;
  immatureExcludedFromDenominatorCount: number;
  cohorts: ClientCohortRow[];
  daysWithoutReturnBuckets: {
    bucket: string;
    count: number;
    clients: ClientSegmentDetail[];
  }[];
  topClients: ClientSegmentDetail[];
}

export interface PhaseP3OperationsReport {
  rangeStart: string;
  rangeEnd: string;
  estimationNotice: string;
  identityNotice: string;
  teamCapacity: {
    totalAvailableMinutes: number;
    totalScheduledMinutes: number;
    totalCompletedMinutes: number;
    teamScheduledOccupancyRate: number | null;
    teamCompletedOccupancyRate: number | null;
    teamRealizedPerAvailableHourCents: number | null;
    teamContributionPerOccupiedHourCents: number | null;
    barbers: BarberCapacityRow[];
  };
  heatmap: HeatmapSlot[];
  cancellations: CancellationBreakdownSummary;
  retention: ClientRetentionSummary;
}

export const CANCEL_REASON_LABELS: Record<string, string> = {
  CLIENT_REQUEST: "Solicitação do cliente",
  BARBER_UNAVAILABLE: "Imprevisto do profissional",
  WEATHER_TRAFFIC: "Clima / Trânsito / Atraso",
  DUPLICATE_BOOKING: "Agendamento em duplicidade",
  NO_SHOW_UNNOTIFIED: "Não compareceu sem avisar",
  OTHER: "Outro motivo / Não informado",
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const ORIGIN_LABELS: Record<string, string> = {
  ONLINE: "Online (Autosserviço)",
  WHATSAPP: "WhatsApp (Recepção)",
  WALK_IN: "Presencial (Recepção)",
};

/**
 * Converte uma data UTC para componentes de calendário no fuso de negócio America/Sao_Paulo (UTC-3).
 */
export function toBusinessLocalParts(date: Date): {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  weekday: number; // 0..6
  hour: number; // 0..23
  minute: number; // 0..59
  dayKey: string; // "YYYY-MM-DD"
  monthKey: string; // "YYYY-MM"
} {
  // America/Sao_Paulo = UTC-03:00
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const weekday = shifted.getUTCDay();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");
  return {
    year,
    month,
    day,
    weekday,
    hour,
    minute,
    dayKey: `${year}-${mStr}-${dStr}`,
    monthKey: `${year}-${mStr}`,
  };
}

function parseHHMM(hhmm: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function businessDayTimeToUtcMs(
  year: number,
  month1Based: number,
  day: number,
  hour: number,
  minute: number
): number {
  return Date.UTC(year, month1Based - 1, day, hour + 3, minute, 0, 0);
}

/**
 * Recorta um intervalo [startMs, endMs] aos limites [boundStartMs, boundEndMs].
 */
export function clipInterval(
  interval: TimeInterval,
  boundStartMs: number,
  boundEndMs: number
): TimeInterval | null {
  const startMs = Math.max(interval.startMs, boundStartMs);
  const endMs = Math.min(interval.endMs, boundEndMs);
  return endMs > startMs ? { startMs, endMs } : null;
}

/**
 * Une intervalos sobrepostos ou adjacentes para evitar dupla contagem de minutos.
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const valid = intervals
    .filter((i) => i.endMs > i.startMs)
    .sort((a, b) => a.startMs - b.startMs);
  if (valid.length === 0) return [];

  const merged: TimeInterval[] = [{ ...valid[0] }];
  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const last = merged[merged.length - 1];
    if (current.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, current.endMs);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/**
 * Subtrai intervalos de bloqueio/reuso de uma lista de intervalos base.
 */
export function subtractIntervals(
  baseIntervals: TimeInterval[],
  subIntervals: TimeInterval[]
): TimeInterval[] {
  let result = mergeIntervals(baseIntervals);
  const cutters = mergeIntervals(subIntervals);
  if (result.length === 0 || cutters.length === 0) return result;

  for (const cut of cutters) {
    const next: TimeInterval[] = [];
    for (const seg of result) {
      if (cut.endMs <= seg.startMs || cut.startMs >= seg.endMs) {
        next.push(seg);
      } else {
        if (cut.startMs > seg.startMs) {
          next.push({ startMs: seg.startMs, endMs: cut.startMs });
        }
        if (cut.endMs < seg.endMs) {
          next.push({ startMs: cut.endMs, endMs: seg.endMs });
        }
      }
    }
    result = next;
    if (result.length === 0) break;
  }
  return result;
}

export function sumIntervalsMinutes(intervals: TimeInterval[]): number {
  const merged = mergeIntervals(intervals);
  let totalMs = 0;
  for (const seg of merged) {
    totalMs += seg.endMs - seg.startMs;
  }
  return Math.round(totalMs / 60000);
}

function diffCalendarDays(dayKeyA: string, dayKeyB: string): number {
  const msA = Date.parse(`${dayKeyA}T12:00:00Z`);
  const msB = Date.parse(`${dayKeyB}T12:00:00Z`);
  return Math.round((msB - msA) / 86400000);
}

/**
 * Gera os intervalos de jornada líquida de um barbeiro dentro de [rangeStart, rangeEnd],
 * descontando PAUSE/BLOCK/VACATION e acrescentando EXTRA_SHIFT.
 */
export function buildBarberAvailableIntervals(params: {
  barber: BarberScheduleConfigInput;
  exceptions: ScheduleExceptionInput[];
  rangeStart: Date;
  rangeEnd: Date;
}): TimeInterval[] {
  const { barber, exceptions, rangeStart, rangeEnd } = params;
  const boundStartMs = rangeStart.getTime();
  const boundEndMs = rangeEnd.getTime();

  const startParsed = parseHHMM(barber.workStart);
  const endParsed = parseHHMM(barber.workEnd);
  const workDaysSet = new Set(barber.workDays || []);

  const baseShiftIntervals: TimeInterval[] = [];

  if (
    startParsed &&
    endParsed &&
    workDaysSet.size > 0 &&
    endParsed.hour * 60 + endParsed.minute >
      startParsed.hour * 60 + startParsed.minute
  ) {
    const startParts = toBusinessLocalParts(rangeStart);
    const endParts = toBusinessLocalParts(rangeEnd);

    let cursorMs = Date.UTC(
      startParts.year,
      startParts.month - 1,
      startParts.day,
      12,
      0,
      0
    );
    const limitMs = Date.UTC(
      endParts.year,
      endParts.month - 1,
      endParts.day,
      12,
      0,
      0
    );

    while (cursorMs <= limitMs) {
      const d = new Date(cursorMs);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const weekday = d.getUTCDay();

      if (workDaysSet.has(weekday)) {
        const shiftStartMs = businessDayTimeToUtcMs(
          y,
          m,
          day,
          startParsed.hour,
          startParsed.minute
        );
        const shiftEndMs = businessDayTimeToUtcMs(
          y,
          m,
          day,
          endParsed.hour,
          endParsed.minute
        );
        const clipped = clipInterval(
          { startMs: shiftStartMs, endMs: shiftEndMs },
          boundStartMs,
          boundEndMs
        );
        if (clipped) {
          baseShiftIntervals.push(clipped);
        }
      }
      cursorMs += 86400000;
    }
  }

  const barberExceptions = exceptions.filter(
    (e) => e.barberId === barber.barberId
  );

  const extraIntervals: TimeInterval[] = [];
  const deductionIntervals: TimeInterval[] = [];

  for (const ex of barberExceptions) {
    const clipped = clipInterval(
      { startMs: ex.startTime.getTime(), endMs: ex.endTime.getTime() },
      boundStartMs,
      boundEndMs
    );
    if (!clipped) continue;
    if (ex.kind === "EXTRA_SHIFT") {
      extraIntervals.push(clipped);
    } else {
      deductionIntervals.push(clipped);
    }
  }

  const combinedShift = mergeIntervals([
    ...baseShiftIntervals,
    ...extraIntervals,
  ]);
  return subtractIntervals(combinedShift, deductionIntervals);
}

export function buildPhaseP3OperationsReport(params: {
  barbers: BarberScheduleConfigInput[];
  exceptions: ScheduleExceptionInput[];
  periodAppointments: OperationalAppointmentInput[];
  allHistoricalCompletedAppointments: OperationalAppointmentInput[];
  identityLinks: ClientIdentityLinkInput[];
  rangeStart: Date;
  rangeEnd: Date;
  referenceNow?: Date;
}): PhaseP3OperationsReport {
  const {
    barbers,
    exceptions,
    periodAppointments,
    allHistoricalCompletedAppointments,
    identityLinks,
    rangeStart,
    rangeEnd,
    referenceNow = new Date(),
  } = params;

  const boundStartMs = rangeStart.getTime();
  const boundEndMs = rangeEnd.getTime();
  const refNowMs = referenceNow.getTime();
  const refNowDayKey = toBusinessLocalParts(referenceNow).dayKey;

  // 1. CAPACIDADE E OCUPAÇÃO POR BARBEIRO
  const barberRows: BarberCapacityRow[] = [];
  let totalAvailableMinutes = 0;
  let totalScheduledMinutes = 0;
  let totalCompletedMinutes = 0;
  let totalTeamRealizedCents = 0;
  let totalTeamContributionCents = 0;

  const allBarberAvailableIntervalsMap = new Map<string, TimeInterval[]>();
  const allBarberOccupiedIntervalsMap = new Map<string, TimeInterval[]>();

  // Ensure any barber present in periodAppointments is also represented even if inactive
  const barberConfigMap = new Map<string, BarberScheduleConfigInput>();
  for (const b of barbers) {
    barberConfigMap.set(b.barberId, b);
  }
  for (const appt of periodAppointments) {
    if (!barberConfigMap.has(appt.barberId)) {
      barberConfigMap.set(appt.barberId, {
        barberId: appt.barberId,
        barberName: appt.barberName,
        active: false,
        workDays: [],
        workStart: "",
        workEnd: "",
      });
    }
  }

  for (const barber of barberConfigMap.values()) {
    const availIntervals = buildBarberAvailableIntervals({
      barber,
      exceptions,
      rangeStart,
      rangeEnd,
    });
    allBarberAvailableIntervalsMap.set(barber.barberId, availIntervals);
    const availableMinutes = sumIntervalsMinutes(availIntervals);
    const hasConfiguredSchedule =
      (barber.workDays?.length ?? 0) > 0 &&
      Boolean(parseHHMM(barber.workStart)) &&
      Boolean(parseHHMM(barber.workEnd));

    const barberAppts = periodAppointments.filter(
      (a) => a.barberId === barber.barberId
    );

    const scheduledIntervals: TimeInterval[] = [];
    const completedIntervals: TimeInterval[] = [];
    const canceledIntervals: TimeInterval[] = [];
    const noShowIntervals: TimeInterval[] = [];

    let completedCount = 0;
    let canceledCount = 0;
    let noShowCount = 0;
    let realizedCents = 0;
    let commissionCents = 0;

    for (const appt of barberAppts) {
      const clipped = clipInterval(
        { startMs: appt.startTime.getTime(), endMs: appt.endTime.getTime() },
        boundStartMs,
        boundEndMs
      );

      if (appt.status === "COMPLETED") {
        completedCount += 1;
        realizedCents += appt.priceCents;
        commissionCents += appt.commissionCents;
        if (clipped) {
          completedIntervals.push(clipped);
          scheduledIntervals.push(clipped);
        }
      } else if (appt.status === "PENDING") {
        if (clipped) {
          scheduledIntervals.push(clipped);
        }
      } else if (appt.status === "CANCELED") {
        canceledCount += 1;
        if (clipped) {
          canceledIntervals.push(clipped);
        }
      } else if (appt.status === "NO_SHOW") {
        noShowCount += 1;
        if (clipped) {
          noShowIntervals.push(clipped);
        }
      }
    }

    const mergedScheduled = mergeIntervals(scheduledIntervals);
    allBarberOccupiedIntervalsMap.set(barber.barberId, mergedScheduled);

    const scheduledMinutes = sumIntervalsMinutes(mergedScheduled);
    const completedMinutes = sumIntervalsMinutes(completedIntervals);
    const canceledMinutes = sumIntervalsMinutes(canceledIntervals);
    const noShowMinutes = sumIntervalsMinutes(noShowIntervals);

    // Horários cancelados que NÃO foram reaproveitados por outro agendamento ativo do mesmo barbeiro
    const lostAfterReuseIntervals = subtractIntervals(
      canceledIntervals,
      mergedScheduled
    );
    const effectivelyLostMinutes = sumIntervalsMinutes(lostAfterReuseIntervals);
    const reusedCanceledMinutes = Math.max(
      0,
      canceledMinutes - effectivelyLostMinutes
    );

    const contributionCents = realizedCents - commissionCents;

    const scheduledOccupancyRate =
      availableMinutes > 0
        ? Math.round((scheduledMinutes / availableMinutes) * 1000) / 10
        : null;
    const completedOccupancyRate =
      availableMinutes > 0
        ? Math.round((completedMinutes / availableMinutes) * 1000) / 10
        : null;

    const realizedPerAvailableHourCents =
      availableMinutes > 0
        ? Math.round(realizedCents / (availableMinutes / 60))
        : null;
    const contributionPerOccupiedHourCents =
      completedMinutes > 0
        ? Math.round(contributionCents / (completedMinutes / 60))
        : null;

    totalAvailableMinutes += availableMinutes;
    totalScheduledMinutes += scheduledMinutes;
    totalCompletedMinutes += completedMinutes;
    totalTeamRealizedCents += realizedCents;
    totalTeamContributionCents += contributionCents;

    barberRows.push({
      barberId: barber.barberId,
      barberName: barber.barberName,
      active: barber.active,
      hasConfiguredSchedule,
      availableMinutes,
      scheduledMinutes,
      completedMinutes,
      canceledMinutes,
      reusedCanceledMinutes,
      effectivelyLostMinutes,
      noShowMinutes,
      scheduledOccupancyRate,
      completedOccupancyRate,
      completedCount,
      canceledCount,
      noShowCount,
      realizedCents,
      commissionCents,
      contributionCents,
      realizedPerAvailableHourCents,
      contributionPerOccupiedHourCents,
      isEstimatedDuration: true,
    });
  }

  barberRows.sort((a, b) => b.realizedCents - a.realizedCents);

  // 2. MAPA DE CALOR DE OCUPAÇÃO (Dia da Semana 0..6 x Hora 8..20)
  const heatmapMap = new Map<
    string,
    { availableMs: number; occupiedMs: number }
  >();
  for (let w = 0; w <= 6; w++) {
    for (let h = 8; h <= 20; h++) {
      heatmapMap.set(`${w}:${h}`, { availableMs: 0, occupiedMs: 0 });
    }
  }

  const accumulateIntoHeatmap = (
    intervals: TimeInterval[],
    field: "availableMs" | "occupiedMs"
  ) => {
    for (const seg of intervals) {
      let cursor = seg.startMs;
      while (cursor < seg.endMs) {
        const parts = toBusinessLocalParts(new Date(cursor));
        const hourEndMs = businessDayTimeToUtcMs(
          parts.year,
          parts.month,
          parts.day,
          parts.hour + 1,
          0
        );
        const stepEnd = Math.min(seg.endMs, hourEndMs);
        if (stepEnd <= cursor) break;
        const slot = heatmapMap.get(`${parts.weekday}:${parts.hour}`);
        if (slot) {
          slot[field] += stepEnd - cursor;
        }
        cursor = stepEnd;
      }
    }
  };

  for (const intervals of allBarberAvailableIntervalsMap.values()) {
    accumulateIntoHeatmap(intervals, "availableMs");
  }
  for (const intervals of allBarberOccupiedIntervalsMap.values()) {
    accumulateIntoHeatmap(intervals, "occupiedMs");
  }

  const heatmap: HeatmapSlot[] = [];
  for (let w = 0; w <= 6; w++) {
    for (let h = 8; h <= 20; h++) {
      const slot = heatmapMap.get(`${w}:${h}`)!;
      const availableMinutes = Math.round(slot.availableMs / 60000);
      const occupiedMinutes = Math.round(slot.occupiedMs / 60000);
      const occupancyRate =
        availableMinutes > 0
          ? Math.round((occupiedMinutes / availableMinutes) * 1000) / 10
          : null;
      heatmap.push({
        weekday: w,
        weekdayLabel: WEEKDAY_LABELS[w],
        hour: h,
        availableMinutes,
        occupiedMinutes,
        occupancyRate,
      });
    }
  }

  // 3. CANCELAMENTOS, FALTAS E DENOMINADOR ELEGÍVEL (agenda já transcorrida)
  let completedTerminalCount = 0;
  let canceledTerminalCount = 0;
  let noShowTerminalCount = 0;
  let futureExcludedCount = 0;

  const reasonCounts = new Map<string, number>();
  const originStats = new Map<
    string,
    { completed: number; canceled: number; noShow: number }
  >();

  for (const code of Object.keys(ORIGIN_LABELS)) {
    originStats.set(code, { completed: 0, canceled: 0, noShow: 0 });
  }

  for (const appt of periodAppointments) {
    const isPastOrPresent = appt.startTime.getTime() <= refNowMs;
    const isTerminalStatus =
      appt.status === "COMPLETED" ||
      appt.status === "CANCELED" ||
      appt.status === "NO_SHOW";

    if (!isPastOrPresent || !isTerminalStatus) {
      futureExcludedCount += 1;
      continue;
    }

    const orig =
      originStats.get(appt.origin) ??
      originStats.get("ONLINE")!;

    if (appt.status === "COMPLETED") {
      completedTerminalCount += 1;
      orig.completed += 1;
    } else if (appt.status === "CANCELED") {
      canceledTerminalCount += 1;
      orig.canceled += 1;
      const reasonKey = appt.cancelReasonCode || "OTHER";
      reasonCounts.set(reasonKey, (reasonCounts.get(reasonKey) ?? 0) + 1);
    } else if (appt.status === "NO_SHOW") {
      noShowTerminalCount += 1;
      orig.noShow += 1;
      const reasonKey = appt.cancelReasonCode || "NO_SHOW_UNNOTIFIED";
      reasonCounts.set(reasonKey, (reasonCounts.get(reasonKey) ?? 0) + 1);
    }
  }

  const eligibleTerminalCount =
    completedTerminalCount + canceledTerminalCount + noShowTerminalCount;

  const cancellationRate =
    eligibleTerminalCount > 0
      ? Math.round((canceledTerminalCount / eligibleTerminalCount) * 1000) / 10
      : null;
  const noShowRate =
    eligibleTerminalCount > 0
      ? Math.round((noShowTerminalCount / eligibleTerminalCount) * 1000) / 10
      : null;

  const totalCanceledMinutes = barberRows.reduce(
    (acc, b) => acc + b.canceledMinutes,
    0
  );
  const reusedCanceledMinutes = barberRows.reduce(
    (acc, b) => acc + b.reusedCanceledMinutes,
    0
  );
  const effectivelyLostMinutes = barberRows.reduce(
    (acc, b) => acc + b.effectivelyLostMinutes,
    0
  );

  // 4. IDENTIDADE CANÔNICA, PRIMEIRA VISITA HISTÓRICA, COORTES E RETENÇÃO EM 30 DIAS
  const activeLinkByContactId = new Map<string, ClientIdentityLinkInput>();
  for (const link of identityLinks) {
    if (link.active) {
      activeLinkByContactId.set(link.clientContactId, link);
    }
  }

  const resolveCanonicalIdentity = (appt: OperationalAppointmentInput): {
    key: string;
    displayName: string;
    identityType: "USER" | "CONTACT" | "LINKED_USER";
  } => {
    if (appt.clientId) {
      return {
        key: `user:${appt.clientId}`,
        displayName: appt.clientName,
        identityType: "USER",
      };
    }
    if (appt.clientContactId) {
      const link = activeLinkByContactId.get(appt.clientContactId);
      if (link) {
        return {
          key: `user:${link.canonicalUserId}`,
          displayName: link.canonicalUserName || appt.clientName,
          identityType: "LINKED_USER",
        };
      }
      return {
        key: `contact:${appt.clientContactId}`,
        displayName: appt.clientName,
        identityType: "CONTACT",
      };
    }
    return {
      key: `unknown:${appt.id}`,
      displayName: appt.clientName || "Cliente",
      identityType: "CONTACT",
    };
  };

  interface CanonicalClientHistory {
    canonicalKey: string;
    displayName: string;
    identityType: "USER" | "CONTACT" | "LINKED_USER";
    allVisitDaysSet: Set<string>;
    periodVisitDaysSet: Set<string>;
    servicesInPeriod: number;
    realizedInPeriodCents: number;
    historicalRealizedCents: number;
  }

  const clientHistoryMap = new Map<string, CanonicalClientHistory>();
  const distinctUnlinkedContacts = new Set<string>();

  for (const appt of allHistoricalCompletedAppointments) {
    if (appt.status !== "COMPLETED") continue;

    const idInfo = resolveCanonicalIdentity(appt);
    if (
      appt.clientContactId &&
      !activeLinkByContactId.has(appt.clientContactId)
    ) {
      distinctUnlinkedContacts.add(appt.clientContactId);
    }

    let entry = clientHistoryMap.get(idInfo.key);
    if (!entry) {
      entry = {
        canonicalKey: idInfo.key,
        displayName: idInfo.displayName,
        identityType: idInfo.identityType,
        allVisitDaysSet: new Set<string>(),
        periodVisitDaysSet: new Set<string>(),
        servicesInPeriod: 0,
        realizedInPeriodCents: 0,
        historicalRealizedCents: 0,
      };
      clientHistoryMap.set(idInfo.key, entry);
    }
    if (idInfo.identityType === "LINKED_USER") {
      entry.identityType = "LINKED_USER";
    }

    const dayKey = toBusinessLocalParts(appt.startTime).dayKey;
    entry.allVisitDaysSet.add(dayKey);
    entry.historicalRealizedCents += appt.priceCents;

    const inPeriod =
      appt.startTime.getTime() >= boundStartMs &&
      appt.startTime.getTime() <= boundEndMs;
    if (inPeriod) {
      entry.periodVisitDaysSet.add(dayKey);
      entry.servicesInPeriod += 1;
      entry.realizedInPeriodCents += appt.priceCents;
    }
  }

  const periodStartDayKey = toBusinessLocalParts(rangeStart).dayKey;
  const periodEndDayKey = toBusinessLocalParts(rangeEnd).dayKey;

  let activeClientsInPeriodCount = 0;
  let newClientsInPeriodCount = 0;
  let returningClientsInPeriodCount = 0;
  let recurringInPeriodCount = 0;

  let totalIntervalSumDays = 0;
  let totalIntervalPairsCount = 0;

  // Coortes por mês da primeira visita histórica
  const cohortMap = new Map<
    string,
    {
      cohortMonth: string;
      totalNewClients: number;
      matureClientsCount: number;
      immatureClientsCount: number;
      returnedWithin30dCount: number;
    }
  >();

  const allClientDetails: ClientSegmentDetail[] = [];

  for (const entry of clientHistoryMap.values()) {
    const sortedDays = Array.from(entry.allVisitDaysSet).sort();
    if (sortedDays.length === 0) continue;

    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    const firstMonth = firstDay.slice(0, 7);

    // Intervalo médio entre visitas sucessivas
    let clientAvgInterval: number | null = null;
    if (sortedDays.length >= 2) {
      let sumDiff = 0;
      for (let i = 1; i < sortedDays.length; i++) {
        const diff = diffCalendarDays(sortedDays[i - 1], sortedDays[i]);
        sumDiff += diff;
        totalIntervalSumDays += diff;
        totalIntervalPairsCount += 1;
      }
      clientAvgInterval = Math.round((sumDiff / (sortedDays.length - 1)) * 10) / 10;
    }

    // Avaliação de Coorte de 30 dias a partir da 1ª visita histórica
    const daysSinceFirstVisit = diffCalendarDays(firstDay, refNowDayKey);
    const isMatureMember = daysSinceFirstVisit >= 30;
    const returnedWithin30d = sortedDays.some((d, idx) => {
      if (idx === 0) return false;
      const diff = diffCalendarDays(firstDay, d);
      return diff >= 1 && diff <= 30;
    });

    let cohortEntry = cohortMap.get(firstMonth);
    if (!cohortEntry) {
      cohortEntry = {
        cohortMonth: firstMonth,
        totalNewClients: 0,
        matureClientsCount: 0,
        immatureClientsCount: 0,
        returnedWithin30dCount: 0,
      };
      cohortMap.set(firstMonth, cohortEntry);
    }
    cohortEntry.totalNewClients += 1;
    if (isMatureMember) {
      cohortEntry.matureClientsCount += 1;
      if (returnedWithin30d) {
        cohortEntry.returnedWithin30dCount += 1;
      }
    } else {
      cohortEntry.immatureClientsCount += 1;
    }

    // Classificação no período selecionado
    const visitsInPeriod = entry.periodVisitDaysSet.size;
    if (visitsInPeriod > 0) {
      activeClientsInPeriodCount += 1;
      if (firstDay >= periodStartDayKey && firstDay <= periodEndDayKey) {
        newClientsInPeriodCount += 1;
      } else if (firstDay < periodStartDayKey) {
        returningClientsInPeriodCount += 1;
      }
      if (visitsInPeriod >= 2) {
        recurringInPeriodCount += 1;
      }
    }

    const daysSinceLastVisit = Math.max(
      0,
      diffCalendarDays(lastDay, refNowDayKey)
    );

    allClientDetails.push({
      canonicalKey: entry.canonicalKey,
      displayName: entry.displayName,
      identityType: entry.identityType,
      firstHistoricalVisitDay: firstDay,
      lastHistoricalVisitDay: lastDay,
      visitsInPeriod,
      totalHistoricalVisits: sortedDays.length,
      servicesInPeriod: entry.servicesInPeriod,
      realizedInPeriodCents: entry.realizedInPeriodCents,
      historicalRealizedCents: entry.historicalRealizedCents,
      avgReturnIntervalDays: clientAvgInterval,
      daysSinceLastVisit,
    });
  }

  let consolidatedMatureClientsCount = 0;
  let consolidatedReturned30dCount = 0;
  let immatureExcludedFromDenominatorCount = 0;

  const cohorts: ClientCohortRow[] = Array.from(cohortMap.values())
    .sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth))
    .slice(0, 12)
    .map((c) => {
      consolidatedMatureClientsCount += c.matureClientsCount;
      consolidatedReturned30dCount += c.returnedWithin30dCount;
      immatureExcludedFromDenominatorCount += c.immatureClientsCount;

      const isMatureCohort =
        c.matureClientsCount > 0 && c.immatureClientsCount === 0;
      const retention30dRate =
        c.matureClientsCount > 0
          ? Math.round((c.returnedWithin30dCount / c.matureClientsCount) * 1000) /
            10
          : null;

      let statusNote = "Coorte madura (janela de 30 dias encerrada)";
      if (c.matureClientsCount === 0) {
        statusNote =
          "Coorte imatura: janela de 30 dias ainda em aberto (fora do denominador consolidado)";
      } else if (c.immatureClientsCount > 0) {
        statusNote = `Parcialmente madura (${c.matureClientsCount} maduros, ${c.immatureClientsCount} com janela em aberto)`;
      }

      return {
        cohortMonth: c.cohortMonth,
        totalNewClients: c.totalNewClients,
        matureClientsCount: c.matureClientsCount,
        immatureClientsCount: c.immatureClientsCount,
        returnedWithin30dCount: c.returnedWithin30dCount,
        retention30dRate,
        isMatureCohort,
        statusNote,
      };
    });

  const consolidatedRetention30dRate =
    consolidatedMatureClientsCount > 0
      ? Math.round(
          (consolidatedReturned30dCount / consolidatedMatureClientsCount) * 1000
        ) / 10
      : null;

  const globalAvgReturnIntervalDays =
    totalIntervalPairsCount > 0
      ? Math.round((totalIntervalSumDays / totalIntervalPairsCount) * 10) / 10
      : null;

  const bucket30_59 = allClientDetails.filter(
    (c) => c.daysSinceLastVisit >= 30 && c.daysSinceLastVisit <= 59
  );
  const bucket60_89 = allClientDetails.filter(
    (c) => c.daysSinceLastVisit >= 60 && c.daysSinceLastVisit <= 89
  );
  const bucket90Plus = allClientDetails.filter(
    (c) => c.daysSinceLastVisit >= 90
  );

  const topClients = [...allClientDetails]
    .filter((c) => c.visitsInPeriod > 0 || c.totalHistoricalVisits > 0)
    .sort(
      (a, b) =>
        b.realizedInPeriodCents - a.realizedInPeriodCents ||
        b.historicalRealizedCents - a.historicalRealizedCents
    )
    .slice(0, 15);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    estimationNotice:
      "Ocupação concluída e produtividade por hora ocupada utilizam a duração planejada na agenda (estimativa até que exista cronometragem real de execução).",
    identityNotice:
      "Usuários cadastrados e contatos da recepção nunca são mesclados automaticamente por nome ou telefone. Apenas vínculos auditados pelo administrador unificam a identidade canônica.",
    teamCapacity: {
      totalAvailableMinutes,
      totalScheduledMinutes,
      totalCompletedMinutes,
      teamScheduledOccupancyRate:
        totalAvailableMinutes > 0
          ? Math.round((totalScheduledMinutes / totalAvailableMinutes) * 1000) /
            10
          : null,
      teamCompletedOccupancyRate:
        totalAvailableMinutes > 0
          ? Math.round((totalCompletedMinutes / totalAvailableMinutes) * 1000) /
            10
          : null,
      teamRealizedPerAvailableHourCents:
        totalAvailableMinutes > 0
          ? Math.round(totalTeamRealizedCents / (totalAvailableMinutes / 60))
          : null,
      teamContributionPerOccupiedHourCents:
        totalCompletedMinutes > 0
          ? Math.round(
              totalTeamContributionCents / (totalCompletedMinutes / 60)
            )
          : null,
      barbers: barberRows,
    },
    heatmap,
    cancellations: {
      eligibleTerminalCount,
      completedTerminalCount,
      canceledTerminalCount,
      noShowTerminalCount,
      futureExcludedCount,
      cancellationRate,
      noShowRate,
      totalCanceledMinutes,
      reusedCanceledMinutes,
      effectivelyLostMinutes,
      byReason: Array.from(reasonCounts.entries())
        .map(([reasonCode, count]) => ({
          reasonCode,
          label: CANCEL_REASON_LABELS[reasonCode] || reasonCode,
          count,
        }))
        .sort((a, b) => b.count - a.count),
      byOrigin: Array.from(originStats.entries()).map(([origin, st]) => {
        const denom = st.completed + st.canceled + st.noShow;
        const lossRate =
          denom > 0
            ? Math.round(((st.canceled + st.noShow) / denom) * 1000) / 10
            : null;
        return {
          origin,
          label: ORIGIN_LABELS[origin] || origin,
          completedCount: st.completed,
          canceledCount: st.canceled,
          noShowCount: st.noShow,
          lossRate,
        };
      }),
    },
    retention: {
      activeClientsInPeriodCount,
      newClientsInPeriodCount,
      returningClientsInPeriodCount,
      recurringInPeriodCount,
      separateContactIdentitiesCount: distinctUnlinkedContacts.size,
      linkedIdentitiesCount: activeLinkByContactId.size,
      globalAvgReturnIntervalDays,
      consolidatedMatureClientsCount,
      consolidatedReturned30dCount,
      consolidatedRetention30dRate,
      immatureExcludedFromDenominatorCount,
      cohorts,
      daysWithoutReturnBuckets: [
        {
          bucket: "30 a 59 dias sem retorno",
          count: bucket30_59.length,
          clients: bucket30_59.slice(0, 10),
        },
        {
          bucket: "60 a 89 dias sem retorno",
          count: bucket60_89.length,
          clients: bucket60_89.slice(0, 10),
        },
        {
          bucket: "90+ dias sem retorno",
          count: bucket90Plus.length,
          clients: bucket90Plus.slice(0, 10),
        },
      ],
      topClients,
    },
  };
}
