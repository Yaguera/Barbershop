import { getYYYYMMDD } from './date-utils';

/** Business calendar boundaries use São Paulo's current UTC-03 schedule. */
export function businessDate(year: number, month: number, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0) {
  return new Date(Date.UTC(year, month, day, hour + 3, minute, second, millisecond));
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

export function reportPeriod(
  period: 'today' | 'day' | 'yesterday' | 'week' | 'month' | 'year' | 'all',
  now = new Date()
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
