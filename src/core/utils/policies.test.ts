import { describe,expect,it } from 'vitest';
import { getYYYYMMDD,startOfDay } from './date-utils';
import { reminderKind } from './reminder-policy';
import { reportPeriod } from './report-period';
import { safeRedirect } from './safe-redirect';
describe('redirect destinations', () => {
  it.each(['https://evil.example', '//evil.example', 'javascript:alert(1)', 'https://shop.example.evil.example', '/\\evil.example'])('rejects %s', target => {
    expect(safeRedirect(target, 'https://shop.example')).toBe('https://shop.example');
  });
  it('preserves local paths and queries', () => expect(safeRedirect('/agenda?page=2', 'https://shop.example')).toBe('https://shop.example/agenda?page=2'));
});
describe('reminder boundaries', () => {
  it('uses business day boundaries even when the server runs in UTC', () => {
    const range = reportPeriod('today', new Date('2026-09-08T01:00:00Z'));
    expect(range.startDate.toISOString()).toBe('2026-09-07T03:00:00.000Z');
    expect(range.endDate.toISOString()).toBe('2026-09-08T02:59:59.999Z');
  });
  it.each([[1441, null], [1440, 'reminded24h'], [61, 'reminded24h'], [60, 'reminded1h'], [15, 'reminded15m'], [0, 'remindedStart'], [-15, 'remindedStart'], [-16, 'NO_SHOW']] as const)('%s minutes', (minutes, expected) => {
    const now = new Date('2026-09-08T12:00:00Z');
    expect(reminderKind(new Date(now.getTime() + minutes * 60000), now)).toBe(expected);
  });
  it('converts an ISO instant to the local day, while retaining date-only inputs', () => {
    expect(getYYYYMMDD('2026-09-08T01:00:00Z')).toBe('2026-09-07');
    expect(startOfDay('2026-09-08').toISOString()).toBe('2026-09-08T03:00:00.000Z');
  });
});
