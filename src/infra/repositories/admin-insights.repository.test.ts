import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaAdminInsightsRepository } from "./PrismaAdminInsightsRepository";
import { startOfDay, endOfDay } from "@/core/utils/date-utils";
const { tx } = vi.hoisted(() => ({
  tx: {
    appointment: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    paymentReceipt: { aggregate: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
vi.mock("../db/prisma-client", () => ({
  prisma: {
    $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx),
  },
}));
const range = {
  startDate: startOfDay("2026-10-03"),
  endDate: endOfDay("2026-10-03"),
  barberId: "b1",
};
beforeEach(() => {
  vi.resetAllMocks();
  tx.appointment.count.mockResolvedValue(31);
  tx.appointment.findMany.mockResolvedValue([]);
  tx.appointment.aggregate.mockResolvedValue({ _sum: { priceCents: 93000 } });
  tx.paymentReceipt.aggregate.mockResolvedValue({
    _sum: { amountCents: 90000 },
  });
});
describe("Admin insight database filters", () => {
  it("filtra caixa pela confirmação, sem limitar à data do atendimento", async () => {
    const result = await new PrismaAdminInsightsRepository().details(range, {
      period: "month",
      kind: "received",
      page: 2,
    });
    const where = tx.appointment.count.mock.calls[0][0].where;
    expect(where).toEqual({
      barberId: "b1",
      serviceId: undefined,
      receipt: {
        is: {
          status: "CONFIRMED",
          confirmedAt: { gte: range.startDate, lte: range.endDate },
        },
      },
    });
    expect(where).not.toHaveProperty("startTime");
    expect(tx.paymentReceipt.aggregate).toHaveBeenCalledWith({
      where: { appointment: where },
      _sum: { amountCents: true },
    });
    expect(tx.appointment.findMany.mock.calls[0][0]).toMatchObject({
      skip: 30,
      take: 30,
    });
    expect(result).toMatchObject({ total: 31, amountCents: 90000, page: 2 });
  });
  it("filtra serviços por data e identidade sem confundir contatos com usuários", async () => {
    await new PrismaAdminInsightsRepository().details(range, {
      period: "month",
      kind: "completed",
      serviceId: "s1",
      clientType: "CONTACT",
      clientId: "c1",
    });
    expect(tx.appointment.count.mock.calls[0][0].where).toMatchObject({
      status: "COMPLETED",
      startTime: { gte: range.startDate, lte: range.endDate },
      serviceId: "s1",
      clientContactId: "c1",
    });
    expect(tx.appointment.count.mock.calls[0][0].where).not.toHaveProperty(
      "clientId",
    );
    expect(tx.paymentReceipt.aggregate).not.toHaveBeenCalled();
  });
  it("inclui sem recibo e recibos revertidos em valores sem recebimento confirmado", async () => {
    await new PrismaAdminInsightsRepository().details(range, {
      period: "month",
      kind: "pending",
      page: 999,
    });
    expect(tx.appointment.count.mock.calls[0][0].where).toMatchObject({
      status: "COMPLETED",
      OR: [
        { receipt: { is: null } },
        { receipt: { is: { status: { not: "CONFIRMED" } } } },
      ],
    });
    expect(tx.appointment.findMany.mock.calls[0][0].skip).toBe(30);
  });
  it("mantém a comissão e preço capturados no atendimento nos detalhes", async () => {
    tx.appointment.findMany.mockResolvedValue([
      {
        id: "a1",
        startTime: range.startDate,
        endTime: range.endDate,
        status: "COMPLETED",
        priceCents: 3000,
        commissionCents: 1500,
        client: { name: "Cliente" },
        clientContact: null,
        barber: { user: { name: "Barbeiro" } },
        service: { name: "Corte" },
        receipt: null,
      },
    ]);
    const result = await new PrismaAdminInsightsRepository().details(range, {
      period: "month",
      kind: "completed",
    });
    expect(result.rows[0]).toMatchObject({
      priceCents: 3000,
      commissionCents: 1500,
      amountCents: 3000,
      paid: false,
      confirmedAt: null,
    });
  });
});
