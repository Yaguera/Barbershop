import type { Service } from '@/core/domain/models';
import type { Service as StoredService } from '@/generated/prisma/client';
export function toService(row: StoredService): Service {
  return { ...row, price: Number(row.price), commissionRate: Number(row.commissionRate) };
}
