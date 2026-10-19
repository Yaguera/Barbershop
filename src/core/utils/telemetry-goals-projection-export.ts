export type TelemetryEventName =
  | "booking_started"
  | "booking_details_selected"
  | "appointment_created"
  | "appointment_completed"
  | "appointment_canceled"
  | "appointment_no_show_marked"
  | "payment_confirmed"
  | "payment_record_reversed"
  | "payment_refunded"
  | "expense_recognized"
  | "expense_paid"
  | "commission_paid"
  | "report_exported";

export type GoalMetricCode =
  | "RECEIVED_REVENUE_CENTS"
  | "REALIZED_PRODUCTION_CENTS"
  | "BARBERSHOP_CONTRIBUTION_CENTS"
  | "OCCUPANCY_RATE_PERCENT"
  | "EXPENSE_CEILING_CENTS"
  | "NO_SHOW_MAX_RATE_PERCENT";

export interface TelemetryEventInput {
  id: string;
  eventName: TelemetryEventName;
  journeyId: string | null;
  channel: string | null; // ONLINE, WHATSAPP, WALK_IN
  actorRole: string | null;
  appointmentId: string | null;
  serviceId: string | null;
  barberId: string | null;
  amountCents: number | null;
  occurredAt: Date;
}

export interface DigitalFunnelSummary {
  windowDays: number;
  onlineStartedJourneysCount: number;
  onlineDetailsSelectedJourneysCount: number;
  onlineConfirmedJourneysCount: number;
  onlineSelectionRate: number | null;
  onlineConfirmationRate: number | null;
  onlineDropoffBeforeSelectionCount: number;
  onlineDropoffAfterSelectionCount: number;
  manualOperationalCreatedCount: number;
  whatsappCreatedCount: number;
  walkInCreatedCount: number;
  totalAppointmentsCreatedInPeriod: number;
  separationNote: string;
}

export interface ManagementGoalInput {
  id?: string;
  metricCode: GoalMetricCode;
  monthKey: string; // "YYYY-MM"
  barberId: string; // "ALL" or barberId
  targetValue: number; // cents or tenths of percent (e.g., 750 = 75.0%)
  unit: "CENTS" | "PERCENT_TENTHS";
}

export interface EvaluatedGoalCard {
  metricCode: GoalMetricCode;
  label: string;
  unit: "CENTS" | "PERCENT_TENTHS";
  polarity: "higher_is_better" | "lower_is_better";
  hasGoal: boolean;
  targetValue: number | null;
  actualValue: number;
  attainmentRate: number | null;
  deviationValue: number | null;
  favorable: boolean | null;
  statusLabel: string;
}

export interface EndOfMonthProjectionSummary {
  isCurrentMonth: boolean;
  isEligible: boolean;
  ineligibilityReason: string | null;
  monthKey: string;
  observedDays: number;
  remainingDays: number;
  totalDaysInMonth: number;
  observedRealizedCents: number;
  observedReceivedCents: number;
  futureScheduledPendingCents: number;
  futureScheduledPendingCount: number;
  dailyPaceRealizedCents: number;
  confirmedPlusObservedFloorCents: number;
  linearProjectedRealizedCents: number;
  linearProjectedReceivedCents: number;
  methodologyNote: string;
}

export const GOAL_METRIC_DEFINITIONS: Record<
  GoalMetricCode,
  {
    label: string;
    unit: "CENTS" | "PERCENT_TENTHS";
    polarity: "higher_is_better" | "lower_is_better";
    description: string;
  }
> = {
  RECEIVED_REVENUE_CENTS: {
    label: "Meta de Receita Recebida (Caixa)",
    unit: "CENTS",
    polarity: "higher_is_better",
    description: "Total confirmado no caixa dentro do mês (confirmedAt).",
  },
  REALIZED_PRODUCTION_CENTS: {
    label: "Meta de Produção Realizada (Competência)",
    unit: "CENTS",
    polarity: "higher_is_better",
    description: "Total de serviços concluídos no mês (não substitui caixa).",
  },
  BARBERSHOP_CONTRIBUTION_CENTS: {
    label: "Meta de Contribuição da Barbearia",
    unit: "CENTS",
    polarity: "higher_is_better",
    description: "Receita líquida de serviços menos comissões reconhecidas.",
  },
  OCCUPANCY_RATE_PERCENT: {
    label: "Meta de Ocupação Concluída (%)",
    unit: "PERCENT_TENTHS",
    polarity: "higher_is_better",
    description: "Percentual de minutos concluídos sobre minutos disponíveis.",
  },
  EXPENSE_CEILING_CENTS: {
    label: "Teto de Despesas Operacionais",
    unit: "CENTS",
    polarity: "lower_is_better",
    description: "Limite máximo planejado para despesas e taxas na competência.",
  },
  NO_SHOW_MAX_RATE_PERCENT: {
    label: "Limite Máximo de Faltas (No-Show %)",
    unit: "PERCENT_TENTHS",
    polarity: "lower_is_better",
    description: "Teto aceitável de faltas sobre a agenda já transcorrida.",
  },
};

/**
 * Calcula o funil digital de agendamento (janela de 7 dias) separado
 * estritamente dos agendamentos manuais da recepção (WhatsApp e Presencial).
 */
export function buildBookingFunnel(params: {
  events: TelemetryEventInput[];
  periodCreatedAppointments?: {
    id: string;
    origin: string; // ONLINE, WHATSAPP, WALK_IN
    createdAt: Date;
  }[];
  windowDays?: number;
}): DigitalFunnelSummary {
  const { events, periodCreatedAppointments = [], windowDays = 7 } = params;
  const maxWindowMs = windowDays * 24 * 60 * 60 * 1000;

  const startedByJourney = new Map<string, Date>();
  const selectedByJourney = new Map<string, Date>();
  const createdByJourney = new Map<string, Date>();
  const distinctOnlineAppointmentIds = new Set<string>();
  const distinctWhatsappAppointmentIds = new Set<string>();
  const distinctWalkInAppointmentIds = new Set<string>();

  for (const ev of events) {
    const channel = (ev.channel || "ONLINE").toUpperCase();

    if (ev.eventName === "booking_started" && channel === "ONLINE") {
      const jKey = ev.journeyId || `ev:${ev.id}`;
      const prev = startedByJourney.get(jKey);
      if (!prev || ev.occurredAt < prev) {
        startedByJourney.set(jKey, ev.occurredAt);
      }
    } else if (
      ev.eventName === "booking_details_selected" &&
      channel === "ONLINE"
    ) {
      const jKey = ev.journeyId || `ev:${ev.id}`;
      const prev = selectedByJourney.get(jKey);
      if (!prev || ev.occurredAt < prev) {
        selectedByJourney.set(jKey, ev.occurredAt);
      }
    } else if (ev.eventName === "appointment_created") {
      if (channel === "ONLINE") {
        if (ev.appointmentId) {
          distinctOnlineAppointmentIds.add(ev.appointmentId);
        }
        const jKey =
          ev.journeyId ||
          (ev.appointmentId ? `appt:${ev.appointmentId}` : `ev:${ev.id}`);
        const prev = createdByJourney.get(jKey);
        if (!prev || ev.occurredAt < prev) {
          createdByJourney.set(jKey, ev.occurredAt);
        }
      } else if (channel === "WHATSAPP") {
        distinctWhatsappAppointmentIds.add(ev.appointmentId || ev.id);
      } else if (channel === "WALK_IN") {
        distinctWalkInAppointmentIds.add(ev.appointmentId || ev.id);
      }
    }
  }

  // Reconcilia também com os agendamentos persistidos no banco caso tenham sido criados antes do início da telemetria
  for (const appt of periodCreatedAppointments) {
    const origin = (appt.origin || "ONLINE").toUpperCase();
    if (origin === "WHATSAPP") {
      distinctWhatsappAppointmentIds.add(appt.id);
    } else if (origin === "WALK_IN") {
      distinctWalkInAppointmentIds.add(appt.id);
    } else {
      distinctOnlineAppointmentIds.add(appt.id);
    }
  }

  const onlineStartedJourneysCount = startedByJourney.size;
  let onlineDetailsSelectedJourneysCount = 0;
  let onlineConfirmedJourneysCount = 0;

  for (const [jKey, startAt] of startedByJourney.entries()) {
    const selAt = selectedByJourney.get(jKey);
    const confAt = createdByJourney.get(jKey);

    if (selAt && selAt.getTime() - startAt.getTime() <= maxWindowMs) {
      onlineDetailsSelectedJourneysCount += 1;
    }
    if (confAt && confAt.getTime() - startAt.getTime() <= maxWindowMs) {
      onlineConfirmedJourneysCount += 1;
      if (!selAt) {
        onlineDetailsSelectedJourneysCount += 1;
      }
    }
  }

  // Se houver jornadas confirmadas com journeyId próprio cujo start estava no mesmo fluxo
  if (
    onlineStartedJourneysCount === 0 &&
    distinctOnlineAppointmentIds.size > 0
  ) {
    // Mantém zero nas jornadas iniciadas se ainda não havia telemetria de início,
    // sem inventar taxa de conversão falsa
    onlineConfirmedJourneysCount = createdByJourney.size;
  }

  const onlineSelectionRate =
    onlineStartedJourneysCount > 0
      ? Math.round(
          (onlineDetailsSelectedJourneysCount / onlineStartedJourneysCount) *
            1000
        ) / 10
      : null;

  const onlineConfirmationRate =
    onlineStartedJourneysCount > 0
      ? Math.round(
          (onlineConfirmedJourneysCount / onlineStartedJourneysCount) * 1000
        ) / 10
      : null;

  const onlineDropoffBeforeSelectionCount = Math.max(
    0,
    onlineStartedJourneysCount - onlineDetailsSelectedJourneysCount
  );
  const onlineDropoffAfterSelectionCount = Math.max(
    0,
    onlineDetailsSelectedJourneysCount - onlineConfirmedJourneysCount
  );

  const whatsappCreatedCount = distinctWhatsappAppointmentIds.size;
  const walkInCreatedCount = distinctWalkInAppointmentIds.size;
  const manualOperationalCreatedCount =
    whatsappCreatedCount + walkInCreatedCount;
  const totalAppointmentsCreatedInPeriod =
    distinctOnlineAppointmentIds.size + manualOperationalCreatedCount;

  return {
    windowDays,
    onlineStartedJourneysCount,
    onlineDetailsSelectedJourneysCount,
    onlineConfirmedJourneysCount,
    onlineSelectionRate,
    onlineConfirmationRate,
    onlineDropoffBeforeSelectionCount,
    onlineDropoffAfterSelectionCount,
    manualOperationalCreatedCount,
    whatsappCreatedCount,
    walkInCreatedCount,
    totalAppointmentsCreatedInPeriod,
    separationNote: `Funil digital avaliado com janela de ${windowDays} dias por jornada online deduplicada. Reservas manuais da recepção (WhatsApp: ${whatsappCreatedCount}, Presencial: ${walkInCreatedCount}) são contabilizadas separadamente e nunca divididas pelo tráfego online.`,
  };
}

/**
 * Avalia as metas opcionais cadastradas pelo administrador sem inventar metas sintéticas.
 */
export function evaluateManagementGoals(params: {
  configuredGoals: ManagementGoalInput[];
  actuals: {
    receivedRevenueCents: number;
    realizedProductionCents: number;
    barbershopContributionCents: number;
    occupancyRatePercent: number | null; // ex.: 68.5
    recognizedExpensesCents: number;
    noShowRatePercent: number | null; // ex.: 4.2
  };
}): EvaluatedGoalCard[] {
  const { configuredGoals, actuals } = params;
  const goalMap = new Map<GoalMetricCode, ManagementGoalInput>();
  for (const g of configuredGoals) {
    goalMap.set(g.metricCode, g);
  }

  const codes = Object.keys(GOAL_METRIC_DEFINITIONS) as GoalMetricCode[];

  return codes.map((code) => {
    const def = GOAL_METRIC_DEFINITIONS[code];
    const configured = goalMap.get(code);

    let actualValue = 0;
    if (code === "RECEIVED_REVENUE_CENTS") {
      actualValue = actuals.receivedRevenueCents;
    } else if (code === "REALIZED_PRODUCTION_CENTS") {
      actualValue = actuals.realizedProductionCents;
    } else if (code === "BARBERSHOP_CONTRIBUTION_CENTS") {
      actualValue = actuals.barbershopContributionCents;
    } else if (code === "OCCUPANCY_RATE_PERCENT") {
      actualValue =
        actuals.occupancyRatePercent !== null
          ? Math.round(actuals.occupancyRatePercent * 10)
          : 0;
    } else if (code === "EXPENSE_CEILING_CENTS") {
      actualValue = actuals.recognizedExpensesCents;
    } else if (code === "NO_SHOW_MAX_RATE_PERCENT") {
      actualValue =
        actuals.noShowRatePercent !== null
          ? Math.round(actuals.noShowRatePercent * 10)
          : 0;
    }

    if (!configured || configured.targetValue <= 0) {
      return {
        metricCode: code,
        label: def.label,
        unit: def.unit,
        polarity: def.polarity,
        hasGoal: false,
        targetValue: null,
        actualValue,
        attainmentRate: null,
        deviationValue: null,
        favorable: null,
        statusLabel: "Meta não definida",
      };
    }

    const targetValue = configured.targetValue;
    const deviationValue = actualValue - targetValue;
    const attainmentRate =
      targetValue > 0
        ? Math.round((actualValue / targetValue) * 1000) / 10
        : null;

    const favorable =
      def.polarity === "higher_is_better"
        ? actualValue >= targetValue
        : actualValue <= targetValue;

    let statusLabel = "";
    if (def.polarity === "higher_is_better") {
      statusLabel = favorable
        ? "Meta atingida / superada"
        : `Em evolução (${attainmentRate ?? 0}% da meta)`;
    } else {
      statusLabel = favorable
        ? "Dentro do teto planejado"
        : `Acima do teto (${attainmentRate ?? 0}% do limite)`;
    }

    return {
      metricCode: code,
      label: def.label,
      unit: def.unit,
      polarity: def.polarity,
      hasGoal: true,
      targetValue,
      actualValue,
      attainmentRate,
      deviationValue,
      favorable,
      statusLabel,
    };
  });
}

/**
 * Calcula a projeção de fechamento do mês corrente separando explicitamente:
 * 1) Realizado observado nos dias já transcorridos;
 * 2) Carteira de reservas futuras confirmadas/pendentes até o fim do mês;
 * 3) Ritmo linear projetado (somente quando observedDays >= 5).
 */
export function buildEndOfMonthProjection(params: {
  isCurrentMonth: boolean;
  monthKey: string;
  observedDays: number;
  totalDaysInMonth: number;
  observedRealizedCents: number;
  observedReceivedCents: number;
  futureScheduledPendingCents: number;
  futureScheduledPendingCount: number;
}): EndOfMonthProjectionSummary {
  const {
    isCurrentMonth,
    monthKey,
    observedDays,
    totalDaysInMonth,
    observedRealizedCents,
    observedReceivedCents,
    futureScheduledPendingCents,
    futureScheduledPendingCount,
  } = params;

  const remainingDays = Math.max(0, totalDaysInMonth - observedDays);
  const confirmedPlusObservedFloorCents =
    observedRealizedCents + futureScheduledPendingCents;

  if (!isCurrentMonth) {
    return {
      isCurrentMonth: false,
      isEligible: false,
      ineligibilityReason:
        "Projeção de fechamento de mês aplica-se exclusivamente ao mês calendário em andamento.",
      monthKey,
      observedDays,
      remainingDays: 0,
      totalDaysInMonth,
      observedRealizedCents,
      observedReceivedCents,
      futureScheduledPendingCents,
      futureScheduledPendingCount,
      dailyPaceRealizedCents: 0,
      confirmedPlusObservedFloorCents,
      linearProjectedRealizedCents: observedRealizedCents,
      linearProjectedReceivedCents: observedReceivedCents,
      methodologyNote: "Período encerrado ou diferente do mês atual.",
    };
  }

  if (observedDays < 5) {
    return {
      isCurrentMonth: true,
      isEligible: false,
      ineligibilityReason: `Histórico insuficiente no mês atual (${observedDays} de 5 dias mínimos observados). A projeção linear fica oculta para evitar distorções de início de mês.`,
      monthKey,
      observedDays,
      remainingDays,
      totalDaysInMonth,
      observedRealizedCents,
      observedReceivedCents,
      futureScheduledPendingCents,
      futureScheduledPendingCount,
      dailyPaceRealizedCents:
        observedDays > 0 ? Math.round(observedRealizedCents / observedDays) : 0,
      confirmedPlusObservedFloorCents,
      linearProjectedRealizedCents: confirmedPlusObservedFloorCents,
      linearProjectedReceivedCents: observedReceivedCents,
      methodologyNote: `Exibindo apenas o realizado observado (${observedDays}d) + reservas futuras agendadas (${futureScheduledPendingCount}).`,
    };
  }

  const dailyPaceRealizedCents = Math.round(
    observedRealizedCents / observedDays
  );

  const linearProjectedRealizedCents = Math.round(
    (observedRealizedCents / observedDays) * totalDaysInMonth
  );
  const linearProjectedReceivedCents = Math.round(
    (observedReceivedCents / observedDays) * totalDaysInMonth
  );

  return {
    isCurrentMonth: true,
    isEligible: true,
    ineligibilityReason: null,
    monthKey,
    observedDays,
    remainingDays,
    totalDaysInMonth,
    observedRealizedCents,
    observedReceivedCents,
    futureScheduledPendingCents,
    futureScheduledPendingCount,
    dailyPaceRealizedCents,
    confirmedPlusObservedFloorCents,
    linearProjectedRealizedCents,
    linearProjectedReceivedCents,
    methodologyNote: `Estimativa calculada por ritmo diário médio observado em ${observedDays} de ${totalDaysInMonth} dias do mês (${remainingDays} dias restantes). Reservas futuras agendadas são apresentadas separadamente e não se confundem com receita realizada.`,
  };
}

/**
 * Sanitiza uma célula para exportação CSV prevenindo CSV Formula Injection (DDE / Excel / Calc).
 * Qualquer texto iniciado por =, +, -, @, tab ou quebra de linha (que não seja um número puro)
 * recebe um apóstrofo inicial (') e escapamento RFC 4180.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  let str = String(value);
  const trimmed = str.trimStart();

  const isFormulaTrigger =
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@") ||
    str.startsWith("\t") ||
    str.startsWith("\r");

  const isPlainSignedNumber = /^[+-]?\d+([.,]\d+)?$/.test(trimmed);

  if (isFormulaTrigger && !isPlainSignedNumber) {
    str = `'${str}`;
  }

  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildSafeCsvExport(params: {
  reportTitle: string;
  periodLabel: string;
  filterSignature: string;
  calculatedAt: string;
  schemaVersion?: string;
  coverageWarnings?: string[];
  columns: string[];
  rows: (string | number | boolean | null | undefined)[][];
}): string {
  const {
    reportTitle,
    periodLabel,
    filterSignature,
    calculatedAt,
    schemaVersion = "v1.0-P4",
    coverageWarnings = [],
    columns,
    rows,
  } = params;

  const lines: string[] = [];

  // Cabeçalho de governança e contexto
  lines.push(
    [
      sanitizeCsvCell("# Relatório"),
      sanitizeCsvCell(reportTitle),
      sanitizeCsvCell("Versão"),
      sanitizeCsvCell(schemaVersion),
    ].join(";")
  );
  lines.push(
    [
      sanitizeCsvCell("# Período"),
      sanitizeCsvCell(periodLabel),
      sanitizeCsvCell("Fuso Oficial"),
      sanitizeCsvCell("America/Sao_Paulo"),
    ].join(";")
  );
  lines.push(
    [
      sanitizeCsvCell("# Filtros Ativos"),
      sanitizeCsvCell(filterSignature),
      sanitizeCsvCell("Apurado em"),
      sanitizeCsvCell(calculatedAt),
    ].join(";")
  );

  for (const warn of coverageWarnings) {
    lines.push(
      [sanitizeCsvCell("# Aviso de Cobertura"), sanitizeCsvCell(warn)].join(";")
    );
  }

  lines.push(""); // Linha em branco separadora
  lines.push(columns.map((c) => sanitizeCsvCell(c)).join(";"));

  for (const row of rows) {
    lines.push(row.map((cell) => sanitizeCsvCell(cell)).join(";"));
  }

  return `\uFEFF${lines.join("\r\n")}`;
}
