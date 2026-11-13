export type ServiceCategoryKey = 'todos' | 'cortes' | 'barba_combos' | 'cuidados';

const FALLBACK_SERVICE_IMAGES = [
  '/images/services/corte_degrade.png',
  '/images/services/corte_social.png',
  '/images/service_image.png',
  '/images/services/barboterapia.png',
  '/images/services/combo_social.png',
  '/images/services/acabamento.png',
  '/images/services/tratamento.png',
] as const;

function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getServiceImage(
  name: string,
  customImage?: string | null,
  index = 0
): string {
  if (customImage && customImage.trim().length > 0) {
    return customImage.trim();
  }

  const normalized = normalizeServiceName(name);

  if (normalized.includes('barboterapia')) {
    return '/images/services/barboterapia.png';
  }
  if (normalized.includes('combo')) {
    return '/images/services/combo_social.png';
  }
  if (normalized.includes('barba')) {
    return '/images/service_image.png';
  }
  if (normalized.includes('degrade') || normalized.includes('pezinho')) {
    return '/images/services/corte_degrade.png';
  }
  if (
    normalized.includes('social') ||
    normalized.includes('tesoura') ||
    normalized.includes('kids') ||
    normalized.includes('corte')
  ) {
    return '/images/services/corte_social.png';
  }
  if (normalized.includes('hidratacao') || normalized.includes('lavagem')) {
    return '/images/services/tratamento.png';
  }
  if (
    normalized.includes('luzes') ||
    normalized.includes('nevou') ||
    normalized.includes('pigmentacao') ||
    normalized.includes('sobrancelha')
  ) {
    return '/images/services/acabamento.png';
  }

  const safeIndex = Math.abs(index) % FALLBACK_SERVICE_IMAGES.length;
  return FALLBACK_SERVICE_IMAGES[safeIndex];
}

export function getServiceCategory(
  name: string
): Exclude<ServiceCategoryKey, 'todos'> {
  const normalized = normalizeServiceName(name);

  if (
    normalized.includes('barba') ||
    normalized.includes('barboterapia') ||
    normalized.includes('combo')
  ) {
    return 'barba_combos';
  }

  if (
    normalized.includes('degrade') ||
    normalized.includes('social') ||
    normalized.includes('tesoura') ||
    normalized.includes('kids') ||
    normalized.includes('pezinho') ||
    normalized.includes('corte')
  ) {
    return 'cortes';
  }

  return 'cuidados';
}
