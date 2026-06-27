import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BookingState {
  serviceId: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  barberId: string | null;
  barberName: string | null;
  startTime: string | null; // ISO string to preserve date across JSON serialization
  setService: (id: string, name: string, price: number) => void;
  setBarber: (id: string, name: string) => void;
  setStartTime: (time: string | null) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      serviceId: null,
      serviceName: null,
      servicePrice: null,
      barberId: null,
      barberName: null,
      startTime: null,

      setService: (id, name, price) =>
        set({
          serviceId: id,
          serviceName: name,
          servicePrice: price,
          // Reset subsequent steps if service changes
          barberId: null,
          barberName: null,
          startTime: null,
        }),

      setBarber: (id, name) =>
        set({
          barberId: id,
          barberName: name,
          startTime: null, // Reset time if barber changes
        }),

      setStartTime: (time) => set({ startTime: time }),

      clearBooking: () =>
        set({
          serviceId: null,
          serviceName: null,
          servicePrice: null,
          barberId: null,
          barberName: null,
          startTime: null,
        }),
    }),
    {
      name: 'barber-booking-storage', // Key in localStorage
      storage: createJSONStorage(() => window.localStorage),
    }
  )
);
