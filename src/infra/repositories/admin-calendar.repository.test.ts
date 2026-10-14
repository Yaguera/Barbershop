import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaAdminCalendarRepository } from "./PrismaAdminCalendarRepository";
import { emptyCalendarSummary } from "@/core/utils/admin-calendar";
const { tx } = vi.hoisted(() => ({
  tx: {
    $queryRaw: vi.fn(),
    barber: { findUnique: vi.fn() },
    appointment: { findMany: vi.fn() },
  },
}));
vi.mock("../db/prisma-client", () => ({
  prisma: {
    $transaction: async (callback: (value: typeof tx) => Promise<unknown>) =>
      callback(tx),
  },
}));
const appointment = {
  id: "a1",
  startTime: new Date("2026-10-04T12:00:00Z"),
  endTime: new Date("2026-10-04T12:30:00Z"),
  status: "COMPLETED",
  origin: "WHATSAPP",
  priceCents: 3000,
  commissionCents: 1500,
  barberId: "b1",
  client: null,
  clientContact: { name: "Contato" },
  service: { name: "Corte" },
  barber: { user: { name: "Barbeiro", active: false } },
  receipt: {
    status: "CONFIRMED",
    confirmedAt: new Date("2026-10-05T12:30:00Z"),
    amountCents: 3000,
    method: "PIX",
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  tx.barber.findUnique.mockResolvedValue({ id: "b1" });
  tx.$queryRaw.mockResolvedValue([]);
  tx.appointment.findMany.mockResolvedValue([]);
});
describe("Admin calendar persistence queries", () => {
  it("consulta caixa pela confirmação, inclui serviço de outro dia e preserva comissão", async () => {
    tx.appointment.findMany.mockResolvedValue([appointment]);
    tx.$queryRaw.mockResolvedValue([
      {
        ...emptyCalendarSummary(),
        date: "2026-10-05",
        count: 1,
        completed: 1,
        realizedCents: 3000,
        receivedCents: 3000,
        reservedMinutes: 30,
      },
    ]);
    const result = await new PrismaAdminCalendarRepository().getMetrics(
      2026,
      10,
      5,
      { context: "cash", barberId: "b1", payment: "paid" },
    );
    const where = tx.appointment.findMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty("startTime");
    expect(where.receipt.is).toEqual({
      status: "CONFIRMED",
      confirmedAt: {
        gte: new Date("2026-10-05T03:00:00Z"),
        lte: new Date("2026-10-06T02:59:59.999Z"),
      },
    });
    const query = tx.$queryRaw.mock.calls[0][0];
    expect(query.text).toContain('WHERE r."confirmedAt" >=');
    expect(query.text).toContain("AND r.status = 'CONFIRMED'");
    expect(result.summary).toMatchObject({ count: 1, receivedCents: 3000 });
    expect(result.appointments[0]).toMatchObject({
      barberActive: false,
      priceCents: 3000,
      commissionCents: 1500,
      clientType: "CONTACT",
      paymentStatus: "CONFIRMED",
    });
  });
  it("consulta agenda pelo atendimento, não considera estorno como pagamento vigente", async () => {
    tx.appointment.findMany.mockResolvedValue([
      {
        ...appointment,
        receipt: { ...appointment.receipt, status: "REVERSED" },
      },
    ]);
    const result = await new PrismaAdminCalendarRepository().getMetrics(
      2026,
      10,
      4,
      { context: "agenda", status: "COMPLETED", payment: "unpaid" },
    );
    const where = tx.appointment.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      startTime: {
        gte: new Date("2026-10-04T03:00:00Z"),
        lte: new Date("2026-10-05T02:59:59.999Z"),
      },
      status: "COMPLETED",
      OR: [
        { receipt: { is: null } },
        { receipt: { is: { status: { not: "CONFIRMED" } } } },
      ],
    });
    expect(tx.$queryRaw.mock.calls[0][0].text).toContain(
      'WHERE a."startTime" >=',
    );
    expect(result.appointments[0]).toMatchObject({
      paymentStatus: "REVERSED",
      receivedCents: 0,
      confirmedAt: null,
      paymentMethod: null,
    });
  });
  it("não carrega todos os detalhes na consulta anual e mantém agrupamento em Brasília", async () => {
    await new PrismaAdminCalendarRepository().getMetrics(2026);
    expect(tx.appointment.findMany).not.toHaveBeenCalled();
    const query = tx.$queryRaw.mock.calls[0][0];
    expect(query.text).toContain("AT TIME ZONE 'America/Sao_Paulo'");
    expect(query.values).toContain("YYYY-MM");
    expect(query.values).toContainEqual(new Date("2026-01-01T03:00:00Z"));
    expect(query.values).toContainEqual(new Date("2027-01-01T02:59:59.999Z"));
  });
  it("não mostra ausência de reservas para um profissional inexistente", async () => {
    tx.barber.findUnique.mockResolvedValue(null);
    await expect(
      new PrismaAdminCalendarRepository().getMetrics(2026, 10, 5, {
        barberId: "missing",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
});
