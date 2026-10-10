export function reminderKind(startTime: Date, now: Date) {
  const minutes = (startTime.getTime() - now.getTime()) / 60000;
  if (minutes < -15) return 'NO_SHOW';
  if (minutes <= 0) return 'remindedStart';
  if (minutes <= 15) return 'reminded15m';
  if (minutes <= 60) return 'reminded1h';
  if (minutes <= 1440) return 'reminded24h';
  return null;
}
