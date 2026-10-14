import { getYYYYMMDD } from "@/core/utils/date-utils";

export interface BookingSlot {
  label: string;
  startTime: string;
  available: boolean;
}

/** Availability returns a display time and a separate timestamp for submission. */
export function parseBookingSlots(value: unknown, date: string): BookingSlot[] {
  if (!Array.isArray(value)) throw new Error("Resposta de horários inválida.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Horário inválido.");
    const slot = item as Record<string, unknown>;
    if (
      typeof slot.dateTime !== "string" ||
      typeof slot.available !== "boolean"
    ) {
      throw new Error("Horário inválido.");
    }
    const start = new Date(slot.dateTime);
    if (Number.isNaN(start.getTime()) || getYYYYMMDD(start) !== date) {
      throw new Error("Horário fora da data consultada.");
    }
    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }).format(start),
      startTime: start.toISOString(),
      available: slot.available,
    };
  });
}

export interface CustomerFields {
  name: string;
  phone: string;
  email: string;
}

export function validateNewContact(
  fields: CustomerFields,
  origin: "WHATSAPP" | "WALK_IN",
) {
  const errors: Partial<Record<keyof CustomerFields, string>> = {};
  if (fields.name.trim().length < 2)
    errors.name = "Informe o nome do cliente (pelo menos 2 caracteres).";
  const digits = fields.phone.replace(/\D/g, "");
  if ((origin === "WHATSAPP" || fields.phone.trim()) && digits.length < 10) {
    errors.phone = "Informe o telefone com DDD.";
  }
  if (
    fields.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
  ) {
    errors.email = "Confira o endereço de e-mail.";
  }
  return errors;
}

export function shiftBookingDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00-03:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return getYYYYMMDD(value);
}
