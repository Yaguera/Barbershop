import { describe, expect, it } from "vitest";
import {
  parseBookingSlots,
  shiftBookingDate,
  validateNewContact,
} from "./manual-booking";

describe("manual booking availability contract", () => {
  it("renders HH:mm and submits the separate ISO timestamp, including the local day", () => {
    expect(
      parseBookingSlots(
        [
          {
            time: "09:30",
            dateTime: "2030-10-14T12:30:00.000Z",
            available: true,
          },
        ],
        "2030-10-14",
      ),
    ).toEqual([
      {
        label: "09:30",
        startTime: "2030-10-14T12:30:00.000Z",
        available: true,
      },
    ]);
  });
  it("keeps unavailable slots distinguishable from free slots", () => {
    expect(
      parseBookingSlots(
        [{ dateTime: "2030-10-14T12:30:00Z", available: false }],
        "2030-10-14",
      )[0].available,
    ).toBe(false);
  });
  it("rejects a malformed response instead of displaying no vacancies", () => {
    expect(() => parseBookingSlots({ error: "Falha" }, "2030-10-14")).toThrow();
    expect(() =>
      parseBookingSlots([{ time: "09:00", available: true }], "2030-10-14"),
    ).toThrow();
  });
  it("rejects timestamps from a different local day", () => {
    expect(() =>
      parseBookingSlots(
        [{ dateTime: "2030-10-15T12:00:00Z", available: true }],
        "2030-10-14",
      ),
    ).toThrow();
  });
});

describe("manual customer validation and dates", () => {
  it("requires a name and WhatsApp phone, with field errors", () => {
    expect(
      validateNewContact({ name: " ", phone: "", email: "" }, "WHATSAPP"),
    ).toHaveProperty("name");
    expect(
      validateNewContact({ name: "Ana", phone: "123", email: "" }, "WHATSAPP"),
    ).toHaveProperty("phone");
  });
  it("allows walk-in customers without phone or email", () => {
    expect(
      validateNewContact({ name: "Ana", phone: "", email: "" }, "WALK_IN"),
    ).toEqual({});
  });
  it("validates an optional email when supplied", () => {
    expect(
      validateNewContact(
        { name: "Ana", phone: "", email: "invalid" },
        "WALK_IN",
      ),
    ).toHaveProperty("email");
  });
  it("moves dates across month/year boundaries without overflowing the day", () => {
    expect(shiftBookingDate("2030-12-31", 1)).toBe("2031-01-01");
    expect(shiftBookingDate("2032-03-01", -1)).toBe("2032-02-29");
  });
});
