import { BarberRepository } from '../domain/repositories/BarberRepository';
import { AppointmentRepository } from '../domain/repositories/AppointmentRepository';
import { ServiceRepository } from '../domain/repositories/ServiceRepository';
import { startOfDay, endOfDay, getYYYYMMDD, getLocalDayOfWeek } from '../utils/date-utils';

export interface GetBarberAvailabilityRequest {
  barberId: string;
  date: Date;
  serviceId?: string;
}

export interface AvailabilitySlot {
  time: string; // HH:MM
  dateTime: Date;
  available: boolean;
}

export class GetBarberAvailabilityUseCase {
  constructor(
    private barberRepository: BarberRepository,
    private appointmentRepository: AppointmentRepository,
    private serviceRepository: ServiceRepository
  ) {}

  async execute(request: GetBarberAvailabilityRequest): Promise<AvailabilitySlot[]> {
    const { barberId, date, serviceId } = request;

    // 1. Find Barber
    const barber = await this.barberRepository.findById(barberId);
    if (!barber) {
      throw new Error('Barber not found');
    }

    // 2. Check if weekday is a workday
    const dayOfWeek = getLocalDayOfWeek(date);
    if (!barber.workDays.includes(dayOfWeek)) {
      return [];
    }

    // 3. Find service to determine duration
    let durationMinutes = 30; // default to 30 mins (1 block)
    if (serviceId) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }
      durationMinutes = service.durationMinutes;
    }

    const blocksNeeded = Math.ceil(durationMinutes / 30);

    // 4. Retrieve existing appointments for the day using precise local boundaries
    const start = startOfDay(date);
    const end = endOfDay(date);

    const appointments = await this.appointmentRepository.findByBarberAndDate(
      barberId,
      start,
      end
    );

    // Filter active appointments that block time (PENDING or COMPLETED)
    const activeAppointments = appointments.filter(
      (app) => app.status === 'PENDING' || app.status === 'COMPLETED'
    );

    // 5. Generate daily grid of 30-minute blocks
    const slots: AvailabilitySlot[] = [];

    // Parse workStart and workEnd (format: "HH:MM")
    const [startHour, startMin] = barber.workStart.split(':').map(Number);
    const [endHour, endMin] = barber.workEnd.split(':').map(Number);

    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    // Helper to format minutes to "HH:MM"
    const formatMinutes = (totalMinutes: number): string => {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const dateStr = getYYYYMMDD(date);

    // Iterate through each 30-minute block start time
    for (let current = workStartMinutes; current < workEndMinutes; current += 30) {
      const slotTimeStr = formatMinutes(current);
      const slotStart = new Date(`${dateStr}T${slotTimeStr}:00.000-03:00`);

      const slotEndMinutes = current + blocksNeeded * 30;
      const slotEndStr = formatMinutes(slotEndMinutes);
      const slotEnd = new Date(`${dateStr}T${slotEndStr}:00.000-03:00`);

      // Check 1: Does the service fit within working hours?
      const fitsInWorkHours = slotEndMinutes <= workEndMinutes;

      // Check 2: Does it conflict with any active appointment?
      // Overlap occurs if proposed.start < existing.end AND proposed.end > existing.start
      const hasConflict = activeAppointments.some((app) => {
        const appStart = new Date(app.startTime);
        const appEnd = new Date(app.endTime);
        return slotStart < appEnd && slotEnd > appStart;
      });

      // Check 3: Is the slot in the past?
      const now = new Date();
      const isPast = slotStart < now;

      const available = fitsInWorkHours && !hasConflict && !isPast;

      slots.push({
        time: slotTimeStr,
        dateTime: slotStart,
        available,
      });
    }

    return slots;
  }
}
