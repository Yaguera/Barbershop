export interface BookingResumeInput {
  authenticated: boolean;
  serviceId: string | null;
  servicePrice: number | null;
  barberId: string | null;
  startTime: string | null;
  services: { id: string; price: number }[];
  barbers: { id: string; active?: boolean }[];
  now: number;
}

/** A saved draft is only a selection; the server still validates availability on confirmation. */
export function canResumeBooking(input: BookingResumeInput): boolean {
  const service = input.services.find((item) => item.id === input.serviceId);
  const barber = input.barbers.find((item) => item.id === input.barberId && item.active !== false);
  const start = input.startTime ? new Date(input.startTime).getTime() : NaN;
  return Boolean(input.authenticated && service && barber && start > input.now && service.price === input.servicePrice);
}
