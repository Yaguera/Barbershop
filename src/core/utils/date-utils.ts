/**
 * Utilities for precise local date boundary calculation supporting America/Sao_Paulo (-03:00) timezone.
 */

export function getYYYYMMDD(d: Date | string): string {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    return d.substring(0, 10);
  }
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

export function startOfDay(date: Date | string): Date {
  const dateStr = getYYYYMMDD(date);
  return new Date(`${dateStr}T00:00:00.000-03:00`);
}

export function endOfDay(date: Date | string): Date {
  const dateStr = getYYYYMMDD(date);
  return new Date(`${dateStr}T23:59:59.999-03:00`);
}

export function parseLocalDate(dateInput?: string | Date): Date {
  if (!dateInput) {
    return new Date();
  }
  if (dateInput instanceof Date) {
    return new Date(dateInput);
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T12:00:00.000-03:00`);
  }
  return new Date(dateInput);
}

export function getLocalHoursMinutes(date: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === 'hour') hours = Number(part.value) % 24;
    if (part.type === 'minute') minutes = Number(part.value);
  }
  return { hours, minutes };
}

export function getLocalDayOfWeek(date: Date): number {
  const weekdayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekdayStr] ?? date.getDay();
}
