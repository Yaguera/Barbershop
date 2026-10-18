import {
  buildPhaseP3OperationsReport,
  type BarberScheduleConfigInput,
  type ClientIdentityLinkInput,
  type OperationalAppointmentInput,
  type PhaseP3OperationsReport,
  type ScheduleExceptionInput,
  type ScheduleExceptionKind,
} from "@/core/utils/operations-retention-capacity";
import { prisma } from "../db/prisma-client";

export interface PhaseP3WorkspaceData {
  report: PhaseP3OperationsReport;
  exceptions: ScheduleExceptionInput[];
  identityLinks: ClientIdentityLinkInput[];
  unlinkedContacts: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  }[];
  registeredClients: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  }[];
}

let p3TablesInitialized = false;

export class PrismaOperationsCapacityRepository {
  async ensurePhaseP3TablesExist(): Promise<void> {
    if (p3TablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ClientIdentityLink" (
          "id" TEXT NOT NULL,
          "clientContactId" TEXT NOT NULL,
          "canonicalUserId" TEXT NOT NULL,
          "linkedById" TEXT NOT NULL,
          "reason" TEXT,
          "active" BOOLEAN NOT NULL DEFAULT true,
          "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "unlinkedAt" TIMESTAMP(3),
          CONSTRAINT "ClientIdentityLink_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ClientIdentityLink_clientContactId_fkey" FOREIGN KEY ("clientContactId") REFERENCES "ClientContact"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ClientIdentityLink_canonicalUserId_fkey" FOREIGN KEY ("canonicalUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ClientIdentityLink_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "ClientIdentityLink_clientContactId_key" ON "ClientIdentityLink"("clientContactId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BarberScheduleException" (
          "id" TEXT NOT NULL,
          "barberId" TEXT NOT NULL,
          "kind" TEXT NOT NULL,
          "startTime" TIMESTAMP(3) NOT NULL,
          "endTime" TIMESTAMP(3) NOT NULL,
          "reason" TEXT,
          "createdById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BarberScheduleException_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BarberScheduleException_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "BarberScheduleException_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AppointmentStatusEvent" (
          "id" TEXT NOT NULL,
          "appointmentId" TEXT NOT NULL,
          "fromStatus" TEXT,
          "toStatus" TEXT NOT NULL,
          "reasonCode" TEXT,
          "notes" TEXT,
          "actorId" TEXT,
          "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AppointmentStatusEvent_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AppointmentStatusEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      p3TablesInitialized = true;
    } catch (err) {
      console.warn(
        "[PrismaOperationsCapacityRepository] Warning ensuring P3 tables:",
        err
      );
    }
  }

  async getWorkspaceData(params: {
    rangeStart: Date;
    rangeEnd: Date;
    barberId?: string;
    barberIds?: string[];
    serviceIds?: string[];
    origins?: string[];
  }): Promise<PhaseP3WorkspaceData> {
    await this.ensurePhaseP3TablesExist();

    const {
      rangeStart,
      rangeEnd,
      barberId,
      barberIds,
      serviceIds,
      origins,
    } = params;

    const effectiveBarberIds =
      barberIds && barberIds.length > 0
        ? barberIds.filter((id) => id && id !== "all")
        : barberId && barberId !== "all"
          ? [barberId]
          : [];

    const effectiveServiceIds =
      serviceIds && serviceIds.length > 0
        ? serviceIds.filter((id) => id && id !== "all")
        : [];

    const effectiveOrigins =
      origins && origins.length > 0 ? origins.filter(Boolean) : [];

    const barberWhere =
      effectiveBarberIds.length > 0
        ? { id: { in: effectiveBarberIds } }
        : {};

    const apptDimensionWhere = {
      ...(effectiveBarberIds.length > 0
        ? { barberId: { in: effectiveBarberIds } }
        : {}),
      ...(effectiveServiceIds.length > 0
        ? { serviceId: { in: effectiveServiceIds } }
        : {}),
      ...(effectiveOrigins.length > 0
        ? { origin: { in: effectiveOrigins } }
        : {}),
    };

    const [
      barberRows,
      exceptionRows,
      periodApptRows,
      historicalCompletedRows,
      linkRows,
      contactRows,
      clientUserRows,
    ] = await Promise.all([
      prisma.barber.findMany({
        where: barberWhere,
        include: {
          user: { select: { name: true, active: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.barberScheduleException.findMany({
        where: {
          ...(effectiveBarberIds.length > 0
            ? { barberId: { in: effectiveBarberIds } }
            : {}),
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
        include: {
          barber: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startTime: "desc" },
      }),
      prisma.appointment.findMany({
        where: {
          ...apptDimensionWhere,
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
        include: {
          barber: { include: { user: { select: { name: true } } } },
          service: { select: { name: true } },
          client: { select: { name: true } },
          clientContact: { select: { name: true } },
          statusEvents: {
            orderBy: { occurredAt: "desc" },
            take: 1,
          },
        },
        orderBy: { startTime: "desc" },
      }),
      prisma.appointment.findMany({
        where: {
          ...apptDimensionWhere,
          status: "COMPLETED",
        },
        include: {
          barber: { include: { user: { select: { name: true } } } },
          service: { select: { name: true } },
          client: { select: { name: true } },
          clientContact: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.clientIdentityLink.findMany({
        where: { active: true },
        include: {
          clientContact: { select: { name: true } },
          canonicalUser: { select: { name: true } },
        },
        orderBy: { linkedAt: "desc" },
      }),
      prisma.clientContact.findMany({
        include: { identityLink: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.user.findMany({
        where: { role: "CLIENT", active: true },
        select: { id: true, name: true, phone: true, email: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
    ]);

    const barbers: BarberScheduleConfigInput[] = barberRows.map((b) => ({
      barberId: b.id,
      barberName: b.user?.name || "Barbeiro",
      active: b.user?.active ?? true,
      workDays: b.workDays || [],
      workStart: b.workStart || "09:00",
      workEnd: b.workEnd || "18:00",
    }));

    const exceptions: ScheduleExceptionInput[] = exceptionRows.map((ex) => ({
      id: ex.id,
      barberId: ex.barberId,
      barberName: ex.barber?.user?.name || "Barbeiro",
      kind: ex.kind as ScheduleExceptionKind,
      startTime: ex.startTime,
      endTime: ex.endTime,
      reason: ex.reason,
    }));

    const periodAppointments: OperationalAppointmentInput[] =
      periodApptRows.map((a) => ({
        id: a.id,
        barberId: a.barberId,
        barberName: a.barber?.user?.name || "Barbeiro",
        serviceId: a.serviceId,
        serviceName: a.service?.name || "Serviço",
        clientId: a.clientId,
        clientContactId: a.clientContactId,
        clientName: a.client?.name || a.clientContact?.name || "Cliente",
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        origin: a.origin,
        priceCents: a.priceCents,
        commissionCents: a.commissionCents,
        cancelReasonCode: a.statusEvents?.[0]?.reasonCode || null,
      }));

    const allHistoricalCompletedAppointments: OperationalAppointmentInput[] =
      historicalCompletedRows.map((a) => ({
        id: a.id,
        barberId: a.barberId,
        barberName: a.barber?.user?.name || "Barbeiro",
        serviceId: a.serviceId,
        serviceName: a.service?.name || "Serviço",
        clientId: a.clientId,
        clientContactId: a.clientContactId,
        clientName: a.client?.name || a.clientContact?.name || "Cliente",
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        origin: a.origin,
        priceCents: a.priceCents,
        commissionCents: a.commissionCents,
      }));

    const identityLinks: ClientIdentityLinkInput[] = linkRows.map((l) => ({
      id: l.id,
      clientContactId: l.clientContactId,
      contactName: l.clientContact?.name || "Contato",
      canonicalUserId: l.canonicalUserId,
      canonicalUserName: l.canonicalUser?.name || "Cliente",
      active: l.active,
      linkedAt: l.linkedAt,
      reason: l.reason,
    }));

    const report = buildPhaseP3OperationsReport({
      barbers,
      exceptions,
      periodAppointments,
      allHistoricalCompletedAppointments,
      identityLinks,
      rangeStart,
      rangeEnd,
      referenceNow: new Date(),
    });

    const unlinkedContacts = contactRows
      .filter((c) => !c.identityLink || !c.identityLink.active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));

    const registeredClients = clientUserRows.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      phone: u.phone,
      email: u.email,
    }));

    return {
      report,
      exceptions,
      identityLinks,
      unlinkedContacts,
      registeredClients,
    };
  }

  async createScheduleException(params: {
    barberId: string;
    kind: ScheduleExceptionKind;
    startTime: Date;
    endTime: Date;
    reason?: string | null;
    actorId: string;
  }) {
    await this.ensurePhaseP3TablesExist();

    if (params.endTime.getTime() <= params.startTime.getTime()) {
      throw new Error(
        "O horário final da exceção deve ser posterior ao horário inicial."
      );
    }

    return prisma.barberScheduleException.create({
      data: {
        barberId: params.barberId,
        kind: params.kind,
        startTime: params.startTime,
        endTime: params.endTime,
        reason: params.reason?.trim() || null,
        createdById: params.actorId,
      },
    });
  }

  async deleteScheduleException(id: string) {
    await this.ensurePhaseP3TablesExist();
    return prisma.barberScheduleException.delete({
      where: { id },
    });
  }

  async linkClientContactToUser(params: {
    clientContactId: string;
    canonicalUserId: string;
    reason?: string | null;
    actorId: string;
  }) {
    await this.ensurePhaseP3TablesExist();

    const [contact, user] = await Promise.all([
      prisma.clientContact.findUnique({
        where: { id: params.clientContactId },
      }),
      prisma.user.findUnique({
        where: { id: params.canonicalUserId },
      }),
    ]);

    if (!contact) {
      throw new Error("Contato manual da recepção não encontrado.");
    }
    if (!user) {
      throw new Error("Conta de usuário cadastrada não encontrada.");
    }

    return prisma.clientIdentityLink.upsert({
      where: { clientContactId: params.clientContactId },
      create: {
        clientContactId: params.clientContactId,
        canonicalUserId: params.canonicalUserId,
        linkedById: params.actorId,
        reason: params.reason?.trim() || null,
        active: true,
        linkedAt: new Date(),
        unlinkedAt: null,
      },
      update: {
        canonicalUserId: params.canonicalUserId,
        linkedById: params.actorId,
        reason: params.reason?.trim() || null,
        active: true,
        linkedAt: new Date(),
        unlinkedAt: null,
      },
    });
  }

  async unlinkClientContact(clientContactId: string) {
    await this.ensurePhaseP3TablesExist();

    return prisma.clientIdentityLink.update({
      where: { clientContactId },
      data: {
        active: false,
        unlinkedAt: new Date(),
      },
    });
  }
}
