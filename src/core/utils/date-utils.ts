/**
 * Utilities for precise local date boundary calculation without external dependencies.
 */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseLocalDate(dateInput?: string | Date): Date {
  if (!dateInput) {
    return new Date();
  }
  if (dateInput instanceof Date) {
    return new Date(dateInput);
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    // Using noon local time guarantees that setting hours to 0/23 stays on the exact local calendar day
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  return new Date(dateInput);
}
