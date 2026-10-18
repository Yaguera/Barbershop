import { describe, expect, it } from "vitest";
import {
  buildPhaseP3OperationsReport,
  type BarberScheduleConfigInput,
  type ClientIdentityLinkInput,
  type OperationalAppointmentInput,
  type ScheduleExceptionInput,
} from "./operations-retention-capacity";

describe("buildPhaseP3OperationsReport (Fase P3 - Clientes, Capacidade e Operação)", () => {
  const octStart = new Date("2026-10-01T03:00:00.000Z"); // 01/10/2026 00:00 BRT
  const octEnd = new Date("2026-11-01T02:59:59.999Z"); // 31/10/2026 23:59:59 BRT
  const referenceNow = new Date("2026-10-20T18:00:00.000Z"); // 20/10/2026 15:00 BRT

  it("não une homônimos sem vínculo auditado, conta dois serviços no mesmo dia como 1 visita e unifica primeira visita histórica quando vinculado", () => {
    const allHistorical: OperationalAppointmentInput[] = [
      // Contato manual "João Silva" atendido em Agosto/2026 (coorte 2026-08, madura)
      {
        id: "appt-aug-contact-1",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: null,
        clientContactId: "contact-joao-1",
        clientName: "João Silva",
        startTime: new Date("2026-08-10T14:00:00.000Z"),
        endTime: new Date("2026-08-10T14:45:00.000Z"),
        status: "COMPLETED",
        origin: "WHATSAPP",
        priceCents: 5000,
        commissionCents: 2500,
      },
      // Retornou em 25/08/2026 (dentro de 15 dias -> retido em 30d na coorte 2026-08)
      {
        id: "appt-aug-contact-2",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: null,
        clientContactId: "contact-joao-1",
        clientName: "João Silva",
        startTime: new Date("2026-08-25T14:00:00.000Z"),
        endTime: new Date("2026-08-25T14:45:00.000Z"),
        status: "COMPLETED",
        origin: "WHATSAPP",
        priceCents: 5000,
        commissionCents: 2500,
      },
      // Em Outubro/2026, o mesmo "João Silva" criou conta (user-joao-1) e fez 2 serviços NO MESMO DIA (10/10)
      {
        id: "appt-oct-user-1a",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: "user-joao-1",
        clientContactId: null,
        clientName: "João Silva",
        startTime: new Date("2026-10-10T14:00:00.000Z"),
        endTime: new Date("2026-10-10T14:45:00.000Z"),
        status: "COMPLETED",
        origin: "ONLINE",
        priceCents: 5000,
        commissionCents: 2500,
      },
      {
        id: "appt-oct-user-1b",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s2",
        serviceName: "Barba",
        clientId: "user-joao-1",
        clientContactId: null,
        clientName: "João Silva",
        startTime: new Date("2026-10-10T14:45:00.000Z"),
        endTime: new Date("2026-10-10T15:15:00.000Z"),
        status: "COMPLETED",
        origin: "ONLINE",
        priceCents: 3500,
        commissionCents: 1750,
      },
      // Outro contato homônimo "João Silva" (contact-homonimo-2) atendido pela 1ª vez em 05/10/2026 (coorte 2026-10, imatura em 20/10)
      {
        id: "appt-oct-homonym",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: null,
        clientContactId: "contact-homonimo-2",
        clientName: "João Silva",
        startTime: new Date("2026-10-05T16:00:00.000Z"),
        endTime: new Date("2026-10-05T16:45:00.000Z"),
        status: "COMPLETED",
        origin: "WALK_IN",
        priceCents: 5000,
        commissionCents: 2500,
      },
    ];

    const periodAppointments = allHistorical.filter(
      (a) => a.startTime >= octStart && a.startTime <= octEnd
    );

    // A) Sem vínculo: user-joao-1 e contact-joao-1 e contact-homonimo-2 são 3 identidades distintas
    const unlinkedReport = buildPhaseP3OperationsReport({
      barbers: [],
      exceptions: [],
      periodAppointments,
      allHistoricalCompletedAppointments: allHistorical,
      identityLinks: [],
      rangeStart: octStart,
      rangeEnd: octEnd,
      referenceNow,
    });

    // Em outubro, user-joao-1 e contact-homonimo-2 seriam ambos "novos" se não houver vínculo
    expect(unlinkedReport.retention.activeClientsInPeriodCount).toBe(2);
    expect(unlinkedReport.retention.newClientsInPeriodCount).toBe(2);
    expect(unlinkedReport.retention.returningClientsInPeriodCount).toBe(0);

    // B) Com vínculo auditado apenas entre contact-joao-1 -> user-joao-1 (mantendo contact-homonimo-2 separado!)
    const links: ClientIdentityLinkInput[] = [
      {
        id: "link-1",
        clientContactId: "contact-joao-1",
        canonicalUserId: "user-joao-1",
        canonicalUserName: "João Silva",
        active: true,
        linkedAt: new Date("2026-10-10T13:50:00.000Z"),
      },
    ];

    const linkedReport = buildPhaseP3OperationsReport({
      barbers: [],
      exceptions: [],
      periodAppointments,
      allHistoricalCompletedAppointments: allHistorical,
      identityLinks: links,
      rangeStart: octStart,
      rangeEnd: octEnd,
      referenceNow,
    });

    // Agora user-joao-1 herda a 1ª visita histórica de 2026-08-10, portanto em Outubro ele é RETORNANTE (não novo!)
    // E seus 2 serviços no dia 10/10 contam como 1 única visita em Outubro (recurringInPeriodCount = 0)
    expect(linkedReport.retention.activeClientsInPeriodCount).toBe(2);
    expect(linkedReport.retention.newClientsInPeriodCount).toBe(1); // apenas contact-homonimo-2
    expect(linkedReport.retention.returningClientsInPeriodCount).toBe(1); // user-joao-1
    expect(linkedReport.retention.recurringInPeriodCount).toBe(0); // 2 serviços no mesmo dia = 1 visita

    // Coorte 2026-10 (de 05/10, avaliada em 20/10) é IMATURA (15 dias < 30 dias):
    // fica fora do denominador consolidado de retenção de 30 dias!
    expect(linkedReport.retention.consolidatedMatureClientsCount).toBe(1); // apenas a coorte 2026-08
    expect(linkedReport.retention.consolidatedReturned30dCount).toBe(1);
    expect(linkedReport.retention.consolidatedRetention30dRate).toBe(100);
    expect(linkedReport.retention.immatureExcludedFromDenominatorCount).toBe(1);
  });

  it("recorta minutos que atravessam a borda do período, desconta pausas da jornada e separa cancelamentos reaproveitados de tempo efetivamente perdido", () => {
    const dayStart = new Date("2026-10-12T03:00:00.000Z"); // Seg 12/10 00:00 BRT
    const dayEnd = new Date("2026-10-13T02:59:59.999Z"); // Seg 12/10 23:59 BRT

    const barbers: BarberScheduleConfigInput[] = [
      {
        barberId: "b1",
        barberName: "Carlos",
        active: true,
        workDays: [1], // Segunda-feira
        workStart: "09:00",
        workEnd: "13:00", // 4h = 240 min brutos
      },
    ];

    const exceptions: ScheduleExceptionInput[] = [
      {
        id: "ex-pause",
        barberId: "b1",
        kind: "PAUSE",
        startTime: new Date("2026-10-12T15:00:00.000Z"), // 12:00 BRT
        endTime: new Date("2026-10-12T16:00:00.000Z"), // 13:00 BRT (60 min de pausa)
        reason: "Almoço",
      },
    ];

    const periodAppointments: OperationalAppointmentInput[] = [
      // 1) Agendamento cancelado das 09:00 às 10:00 BRT (60 min)
      {
        id: "appt-canceled",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: "u1",
        clientContactId: null,
        clientName: "Cliente 1",
        startTime: new Date("2026-10-12T12:00:00.000Z"), // 09:00 BRT
        endTime: new Date("2026-10-12T13:00:00.000Z"), // 10:00 BRT
        status: "CANCELED",
        origin: "ONLINE",
        priceCents: 6000,
        commissionCents: 3000,
      },
      // 2) Novo cliente preencheu metade da vaga cancelada: 09:00 às 09:30 BRT (30 min reaproveitados!)
      {
        id: "appt-reused",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s2",
        serviceName: "Barba",
        clientId: "u2",
        clientContactId: null,
        clientName: "Cliente 2",
        startTime: new Date("2026-10-12T12:00:00.000Z"), // 09:00 BRT
        endTime: new Date("2026-10-12T12:30:00.000Z"), // 09:30 BRT
        status: "COMPLETED",
        origin: "WALK_IN",
        priceCents: 4000,
        commissionCents: 1600,
      },
      // 3) Atendimento que atravessa o fim do período (23:30 BRT a 00:30 BRT do dia seguinte -> apenas 30 min dentro do dia 12/10)
      {
        id: "appt-boundary",
        barberId: "b1",
        barberName: "Carlos",
        serviceId: "s1",
        serviceName: "Corte",
        clientId: "u3",
        clientContactId: null,
        clientName: "Cliente 3",
        startTime: new Date("2026-10-13T02:30:00.000Z"), // 23:30 BRT de 12/10
        endTime: new Date("2026-10-13T03:30:00.000Z"), // 00:30 BRT de 13/10
        status: "COMPLETED",
        origin: "ONLINE",
        priceCents: 5000,
        commissionCents: 2000,
      },
    ];

    const report = buildPhaseP3OperationsReport({
      barbers,
      exceptions,
      periodAppointments,
      allHistoricalCompletedAppointments: periodAppointments.filter(
        (a) => a.status === "COMPLETED"
      ),
      identityLinks: [],
      rangeStart: dayStart,
      rangeEnd: dayEnd,
      referenceNow,
    });

    const carlos = report.teamCapacity.barbers[0];
    // 240 min de turno - 60 min de pausa = 180 min disponíveis
    expect(carlos.availableMinutes).toBe(180);
    // Minutos concluídos recortados ao período: 30 min (09:00-09:30) + 30 min (23:30-00:00) = 60 min
    expect(carlos.completedMinutes).toBe(60);
    // Cancelado total = 60 min; reaproveitado = 30 min; efetivamente perdido = 30 min
    expect(carlos.canceledMinutes).toBe(60);
    expect(carlos.reusedCanceledMinutes).toBe(30);
    expect(carlos.effectivelyLostMinutes).toBe(30);
  });
});
