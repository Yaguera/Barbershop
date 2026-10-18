import { describe, expect, it } from "vitest";
import {
  buildFinancialStatement,
  type CommissionPayoutInput,
  type ExpenseInput,
  type FinancialAppointmentInput,
} from "./financial-statement";

describe("buildFinancialStatement (Fase P2 - Motor Financeiro)", () => {
  const octStart = new Date("2026-10-01T00:00:00.000Z");
  const octEnd = new Date("2026-10-31T23:59:59.999Z");
  const novStart = new Date("2026-11-01T00:00:00.000Z");
  const novEnd = new Date("2026-11-30T23:59:59.999Z");

  it("deduz a comissão uma única vez na competência e trata o repasse (CommissionPayout) apenas como saída de caixa e baixa de passivo", () => {
    const appointments: FinancialAppointmentInput[] = [
      {
        id: "appt-1",
        barberId: "barber-1",
        barberName: "Carlos",
        clientName: "João",
        serviceName: "Corte",
        date: new Date("2026-10-10T14:00:00.000Z"),
        status: "COMPLETED",
        priceCents: 10000, // R$ 100,00
        commissionCents: 4000, // R$ 40,00 (40%)
        receipt: {
          id: "rec-1",
          status: "CONFIRMED",
          paidAmountCents: 10000,
          method: "PIX",
          confirmedAt: new Date("2026-10-10T14:35:00.000Z"),
        },
      },
      {
        id: "appt-2",
        barberId: "barber-1",
        barberName: "Carlos",
        clientName: "Pedro",
        serviceName: "Barba",
        date: new Date("2026-10-12T15:00:00.000Z"),
        status: "COMPLETED",
        priceCents: 5000, // R$ 50,00
        commissionCents: 2000, // R$ 20,00 (40%)
        receipt: null, // Concluído sem recebimento confirmado
      },
    ];

    const expenses: ExpenseInput[] = [
      {
        id: "exp-1",
        category: "RENT",
        description: "Aluguel Outubro",
        supplier: "Imobiliária",
        amountCents: 3000, // R$ 30,00
        competenceDate: new Date("2026-10-05T12:00:00.000Z"),
        dueDate: new Date("2026-10-10T12:00:00.000Z"),
        paidAt: new Date("2026-10-09T12:00:00.000Z"),
        paymentMethod: "PIX",
        status: "PAID",
      },
    ];

    const payouts: CommissionPayoutInput[] = [
      {
        id: "payout-1",
        barberId: "barber-1",
        barberName: "Carlos",
        amountCents: 2500, // R$ 25,00 já repassados ao barbeiro
        periodStart: octStart,
        periodEnd: octEnd,
        paidAt: new Date("2026-10-20T18:00:00.000Z"),
        paymentMethod: "PIX",
        notes: "Adiantamento quinzena",
        status: "PAID",
      },
    ];

    const report = buildFinancialStatement({
      appointments,
      expenses,
      payouts,
      rangeStart: octStart,
      rangeEnd: octEnd,
    });

    // Competência: Receita realizada = R$ 150,00; Comissão reconhecida = R$ 60,00 (40 + 20)
    // Contribuição da barbearia = 150 - 60 = R$ 90,00
    // Despesas operacionais = R$ 30,00 -> Resultado gerencial = R$ 60,00 (não deduz o payout de R$ 25,00 novamente!)
    expect(report.competence.grossRealizedCents).toBe(15000);
    expect(report.competence.recognizedCommissionCents).toBe(6000);
    expect(report.competence.barbershopContributionCents).toBe(9000);
    expect(report.competence.recognizedOperatingExpensesCents).toBe(3000);
    expect(report.competence.managementResultCents).toBe(6000);
    expect(report.competence.isCompleteResult).toBe(true);

    // Folha de comissão do barbeiro:
    // Reconhecida = 6000, Elegível (com recebimento confirmado) = 4000, Pendente de recebimento = 2000
    // Já paga = 2500 -> Saldo líquido a pagar = 4000 - 2500 = 1500
    expect(report.barberCommissions).toHaveLength(1);
    const carlos = report.barberCommissions[0];
    expect(carlos.recognizedCommissionCents).toBe(6000);
    expect(carlos.eligibleCommissionCents).toBe(4000);
    expect(carlos.pendingReceiptCommissionCents).toBe(2000);
    expect(carlos.paidCommissionCents).toBe(2500);
    expect(carlos.payableCommissionCents).toBe(1500);

    // Fluxo de caixa: Entrada = 10000, Saída Despesa = 3000, Saída Repasse = 2500 -> Líquido = 4500
    expect(report.cashFlow.cashInReceiptsCents).toBe(10000);
    expect(report.cashFlow.cashOutExpensesPaidCents).toBe(3000);
    expect(report.cashFlow.cashOutCommissionPayoutsCents).toBe(2500);
    expect(report.cashFlow.netCashFlowCents).toBe(4500);
  });

  it("preserva a fotografia histórica de outubro quando um recebimento confirmado em outubro é estornado/devolvido em novembro", () => {
    const appointments: FinancialAppointmentInput[] = [
      {
        id: "appt-oct-nov",
        barberId: "barber-1",
        barberName: "Carlos",
        clientName: "Lucas",
        serviceName: "Corte + Barba",
        date: new Date("2026-10-25T16:00:00.000Z"),
        status: "COMPLETED",
        priceCents: 9000,
        commissionCents: 3600,
        receipt: {
          id: "rec-oct",
          status: "REVERTED",
          paidAmountCents: 9000,
          method: "CARD",
          confirmedAt: new Date("2026-10-25T16:40:00.000Z"),
          reversal: {
            type: "CLIENT_REFUND",
            reason: "Estorno solicitado pelo cliente em novembro",
            revertedAt: new Date("2026-11-03T10:00:00.000Z"),
          },
        },
      },
    ];

    const octReport = buildFinancialStatement({
      appointments,
      expenses: [],
      payouts: [],
      rangeStart: octStart,
      rangeEnd: octEnd,
    });

    // Em outubro, o recebimento estava confirmado e não havia saída de devolução
    expect(octReport.cashFlow.cashInReceiptsCents).toBe(9000);
    expect(octReport.cashFlow.cashOutRefundsCents).toBe(0);
    expect(octReport.competence.competenceAdjustmentsCents).toBe(0);
    expect(octReport.competence.netServiceRevenueCents).toBe(9000);

    // Em novembro, a devolução ao cliente reduz o caixa de novembro e lança ajuste na competência de novembro
    const novReport = buildFinancialStatement({
      appointments,
      expenses: [],
      payouts: [],
      rangeStart: novStart,
      rangeEnd: novEnd,
    });

    expect(novReport.cashFlow.cashInReceiptsCents).toBe(0);
    expect(novReport.cashFlow.cashOutRefundsCents).toBe(9000);
    expect(novReport.cashFlow.netCashFlowCents).toBe(-9000);
    expect(novReport.competence.competenceAdjustmentsCents).toBe(9000);
  });

  it("separa competência, vencimento e pagamento de despesas e alerta cobertura parcial quando não há despesas lançadas", () => {
    const expenses: ExpenseInput[] = [
      {
        id: "exp-oct-comp-nov-pay",
        category: "UTILITIES",
        description: "Conta de Energia Outubro (paga em Novembro)",
        supplier: "Concessionária",
        amountCents: 45000,
        competenceDate: new Date("2026-10-28T12:00:00.000Z"),
        dueDate: new Date("2026-11-05T12:00:00.000Z"),
        paidAt: new Date("2026-11-04T12:00:00.000Z"),
        paymentMethod: "PIX",
        status: "PAID",
      },
    ];

    const octReport = buildFinancialStatement({
      appointments: [],
      expenses,
      payouts: [],
      rangeStart: octStart,
      rangeEnd: octEnd,
    });

    // Entra no resultado de competência de outubro, mas NÃO sai do caixa de outubro
    expect(octReport.competence.recognizedOperatingExpensesCents).toBe(45000);
    expect(octReport.cashFlow.cashOutExpensesPaidCents).toBe(0);
    expect(octReport.competence.isCompleteResult).toBe(true);

    // Em novembro, sai do caixa de novembro, mas não afeta a competência de novembro
    const novReport = buildFinancialStatement({
      appointments: [],
      expenses,
      payouts: [],
      rangeStart: novStart,
      rangeEnd: novEnd,
    });

    expect(novReport.competence.recognizedOperatingExpensesCents).toBe(0);
    expect(novReport.cashFlow.cashOutExpensesPaidCents).toBe(45000);
    expect(novReport.competence.isCompleteResult).toBe(false);
    expect(novReport.competence.coverageNote).toContain("Cobertura parcial");
  });
});
