import { endOfDay, getYYYYMMDD, startOfDay } from './date-utils';
import type {
  InsightComparisonMode,
  InsightPeriod,
} from '../domain/repositories/AdminInsightsRepository';

/** Business calendar boundaries use São Paulo's current UTC-03 schedule. */
export function businessDate(
  year: number,
  month: number,
  day = 1,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  return new Date(
    Date.UTC(year, month, day, hour + 3, minute, second, millisecond),
  );
}

export function formatPeriodRange(startDate: Date, endDate: Date): string {
  if (startDate.getTime() === 0) {
    return 'Histórico Completo';
  }
  const format = (d: Date) =>
    d.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  return `${format(startDate)} a ${format(endDate)}`;
}

export const SERVICE_COLOR_PALETTE = [
  '#D4AF37', // Dourado principal
  '#38BDF8', // Azul celeste
  '#A78BFA', // Violeta suave
  '#F472B6', // Rosa
  '#34D399', // Verde esmeralda
  '#FB923C', // Laranja
  '#E2BE4D', // Ouro claro
  '#94A3B8', // Cinza neutro
];

/**
 * Retorna uma cor fixa e determinística para o serviço pelo nome ou ID,
 * garantindo consistência visual entre todas as telas e filtros.
 */
export function getServiceColor(serviceNameOrId: string): string {
  let hash = 0;
  for (let i = 0; i < serviceNameOrId.length; i++) {
    hash = (hash << 5) - hash + serviceNameOrId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SERVICE_COLOR_PALETTE.length;
  return SERVICE_COLOR_PALETTE[index];
}

export interface ReportPeriodResult {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function daysInCalendarMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function countInclusiveCalendarDays(
  startDate: Date,
  endDate: Date,
): number {
  const s = getYYYYMMDD(startDate);
  const e = getYYYYMMDD(endDate);
  const diff =
    new Date(`${e}T12:00:00Z`).getTime() -
    new Date(`${s}T12:00:00Z`).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

export function reportPeriod(
  period: InsightPeriod | 'day',
  now = new Date(),
  customStart?: string,
  customEnd?: string,
): ReportPeriodResult {
  const [year, monthNumber, day] = getYYYYMMDD(now).split('-').map(Number);
  const month = monthNumber - 1;
  let startDate: Date, nextStart: Date;

  switch (period) {
    case 'day':
    case 'today':
      startDate = businessDate(year, month, day);
      nextStart = businessDate(year, month, day + 1);
      break;
    case 'yesterday':
      startDate = businessDate(year, month, day - 1);
      nextStart = businessDate(year, month, day);
      break;
    case 'week': {
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      startDate = businessDate(year, month, day - weekday);
      nextStart = businessDate(year, month, day - weekday + 7);
      break;
    }
    case 'prev_month':
      startDate = businessDate(year, month - 1, 1);
      nextStart = businessDate(year, month, 1);
      break;
    case 'last_7_days':
      startDate = businessDate(year, month, day - 6);
      nextStart = businessDate(year, month, day + 1);
      break;
    case 'last_30_days':
      startDate = businessDate(year, month, day - 29);
      nextStart = businessDate(year, month, day + 1);
      break;
    case 'last_90_days':
      startDate = businessDate(year, month, day - 89);
      nextStart = businessDate(year, month, day + 1);
      break;
    case 'custom': {
      if (customStart && customEnd) {
        const s = startOfDay(customStart);
        const e = endOfDay(customEnd);
        return {
          startDate: s,
          endDate: e,
          label: formatPeriodRange(s, e),
        };
      }
      startDate = businessDate(year, month, 1);
      nextStart = businessDate(year, month + 1, 1);
      break;
    }
    case 'year':
      startDate = businessDate(year, 0, 1);
      nextStart = businessDate(year + 1, 0, 1);
      break;
    case 'all':
      startDate = new Date(0);
      nextStart = businessDate(year + 1, 0, 1);
      break;
    default:
      startDate = businessDate(year, month, 1);
      nextStart = businessDate(year, month + 1, 1);
  }

  const endDate = new Date(nextStart.getTime() - 1);
  return {
    startDate,
    endDate,
    label: formatPeriodRange(startDate, endDate),
  };
}

export interface ComparisonRangeResult {
  compareStartDate: Date;
  compareEndDate: Date;
  effectiveCurrentEndDate: Date;
  equivalenceNote?: string;
}

/**
 * Resolves the reference range for comparison without distortion (Section 7.1):
 * - Partial current month (MTD) compares only the elapsed days of the current month against the same elapsed days of the reference month.
 * - Partial current year (YTD) compares elapsed days up to today against the same calendar date in the previous year.
 * - Leap year 29/02 maps to 28/02 in non-leap reference years with an explicit note.
 * - Rolling windows / custom ranges compare against the N immediately preceding days without overlap.
 */
export function resolveComparisonRange(
  period: InsightPeriod,
  currentStart: Date,
  currentEnd: Date,
  compareMode: InsightComparisonMode,
  now = new Date(),
  customCompareStart?: string,
  customCompareEnd?: string,
): ComparisonRangeResult | null {
  if (!compareMode || compareMode === 'none' || period === 'all') {
    return null;
  }

  const [nowY, nowM, nowD] = getYYYYMMDD(now).split('-').map(Number);
  const nowMonthIdx = nowM - 1;

  if (compareMode === 'custom') {
    if (!customCompareStart || !customCompareEnd) return null;
    const compareStartDate = startOfDay(customCompareStart);
    const compareEndDate = endOfDay(customCompareEnd);
    const currentDays = countInclusiveCalendarDays(currentStart, currentEnd);
    const compareDays = countInclusiveCalendarDays(
      compareStartDate,
      compareEndDate,
    );
    const equivalenceNote =
      currentDays !== compareDays
        ? `Intervalos com durações diferentes (${currentDays} dias atuais vs ${compareDays} dias na referência).`
        : undefined;
    return {
      compareStartDate,
      compareEndDate,
      effectiveCurrentEndDate: currentEnd,
      equivalenceNote,
    };
  }

  // Handle Year-over-Year ("yoy") or Previous Period ("prev_period")
  if (period === 'month') {
    // Current month is in progress (MTD): cap current end to today so partial month never compares against a full reference month
    const totalDaysCurrentMonth = daysInCalendarMonth(nowY, nowMonthIdx);
    const isPartialMonth = nowD < totalDaysCurrentMonth;
    const effectiveCurrentEndDate = isPartialMonth
      ? new Date(businessDate(nowY, nowMonthIdx, nowD + 1).getTime() - 1)
      : currentEnd;

    if (compareMode === 'prev_period') {
      const refStart = businessDate(nowY, nowMonthIdx - 1, 1);
      const [refY, refM] = getYYYYMMDD(refStart).split('-').map(Number);
      const maxRefDay = daysInCalendarMonth(refY, refM - 1);
      const targetDay = isPartialMonth ? Math.min(nowD, maxRefDay) : maxRefDay;
      const compareEndDate = new Date(
        businessDate(refY, refM - 1, targetDay + 1).getTime() - 1,
      );
      const clampedNote =
        isPartialMonth && nowD > maxRefDay
          ? `Ajustado para o último dia válido do mês anterior (${maxRefDay}/${String(refM).padStart(2, '0')}).`
          : isPartialMonth
            ? `Mês parcial acumulado: comparando os primeiros ${nowD} dias de cada mês.`
            : undefined;
      return {
        compareStartDate: refStart,
        compareEndDate,
        effectiveCurrentEndDate,
        equivalenceNote: clampedNote,
      };
    }

    if (compareMode === 'yoy') {
      const refY = nowY - 1;
      const maxRefDay = daysInCalendarMonth(refY, nowMonthIdx);
      const targetDay = isPartialMonth ? Math.min(nowD, maxRefDay) : maxRefDay;
      const refStart = businessDate(refY, nowMonthIdx, 1);
      const compareEndDate = new Date(
        businessDate(refY, nowMonthIdx, targetDay + 1).getTime() - 1,
      );
      const leapAdjusted =
        nowMonthIdx === 1 &&
        ((isPartialMonth && nowD === 29) ||
          (!isPartialMonth && totalDaysCurrentMonth === 29)) &&
        maxRefDay === 28;
      const equivalenceNote = leapAdjusted
        ? '29/02 ajustado para 28/02 no ano anterior sem ano bissexto.'
        : isPartialMonth
          ? `Mês parcial acumulado: comparando os primeiros ${targetDay} dias com o mesmo mês do ano anterior.`
          : undefined;
      return {
        compareStartDate: refStart,
        compareEndDate,
        effectiveCurrentEndDate,
        equivalenceNote,
      };
    }
  }

  if (period === 'prev_month' && compareMode === 'prev_period') {
    const compareStartDate = businessDate(nowY, nowMonthIdx - 2, 1);
    const compareEndDate = new Date(
      businessDate(nowY, nowMonthIdx - 1, 1).getTime() - 1,
    );
    return {
      compareStartDate,
      compareEndDate,
      effectiveCurrentEndDate: currentEnd,
    };
  }

  if (period === 'year') {
    const effectiveCurrentEndDate = new Date(
      businessDate(nowY, nowMonthIdx, nowD + 1).getTime() - 1,
    );
    const refY = nowY - 1;
    const maxRefDay = daysInCalendarMonth(refY, nowMonthIdx);
    const targetDay = Math.min(nowD, maxRefDay);
    const compareStartDate = businessDate(refY, 0, 1);
    const compareEndDate = new Date(
      businessDate(refY, nowMonthIdx, targetDay + 1).getTime() - 1,
    );
    const leapAdjusted = nowMonthIdx === 1 && nowD === 29 && maxRefDay === 28;
    return {
      compareStartDate,
      compareEndDate,
      effectiveCurrentEndDate,
      equivalenceNote: leapAdjusted
        ? 'Acumulado no ano com 29/02 ajustado para 28/02 no ano anterior.'
        : 'Acumulado no ano (YTD) até a mesma data equivalente do ano anterior.',
    };
  }

  if (compareMode === 'yoy') {
    const [sY, sM, sD] = getYYYYMMDD(currentStart).split('-').map(Number);
    const [eY, eM, eD] = getYYYYMMDD(currentEnd).split('-').map(Number);
    const refSY = sY - 1;
    const refEY = eY - 1;
    const maxSD = daysInCalendarMonth(refSY, sM - 1);
    const maxED = daysInCalendarMonth(refEY, eM - 1);
    const adjSD = Math.min(sD, maxSD);
    const adjED = Math.min(eD, maxED);
    const leapAdjusted = sD !== adjSD || eD !== adjED;
    const compareStartDate = businessDate(refSY, sM - 1, adjSD);
    const compareEndDate = new Date(
      businessDate(refEY, eM - 1, adjED + 1).getTime() - 1,
    );
    return {
      compareStartDate,
      compareEndDate,
      effectiveCurrentEndDate: currentEnd,
      equivalenceNote: leapAdjusted
        ? '29/02 ajustado para 28/02 no ano anterior.'
        : undefined,
    };
  }

  // Default for prev_period on today, yesterday, week, rolling windows (7/30/90 days) and custom ranges:
  // N days vs N immediately preceding days without overlap
  const spanDays = countInclusiveCalendarDays(currentStart, currentEnd);
  const [sY, sM, sD] = getYYYYMMDD(currentStart).split('-').map(Number);
  const compareStartDate = businessDate(sY, sM - 1, sD - spanDays);
  const compareEndDate = new Date(businessDate(sY, sM - 1, sD).getTime() - 1);
  return {
    compareStartDate,
    compareEndDate,
    effectiveCurrentEndDate: currentEnd,
    equivalenceNote:
      spanDays > 1
        ? `Comparando janela de ${spanDays} dias contra os ${spanDays} dias imediatamente anteriores.`
        : undefined,
  };
}

