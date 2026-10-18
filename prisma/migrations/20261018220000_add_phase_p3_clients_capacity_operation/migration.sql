-- Phase P3: Canonical Client Identity Links, Barber Schedule Exceptions, and Appointment Status Events

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

CREATE UNIQUE INDEX IF NOT EXISTS "ClientIdentityLink_clientContactId_key" ON "ClientIdentityLink"("clientContactId");
CREATE INDEX IF NOT EXISTS "ClientIdentityLink_canonicalUserId_active_idx" ON "ClientIdentityLink"("canonicalUserId", "active");

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

CREATE INDEX IF NOT EXISTS "BarberScheduleException_barberId_startTime_endTime_idx" ON "BarberScheduleException"("barberId", "startTime", "endTime");

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

CREATE INDEX IF NOT EXISTS "AppointmentStatusEvent_appointmentId_occurredAt_idx" ON "AppointmentStatusEvent"("appointmentId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AppointmentStatusEvent_toStatus_occurredAt_idx" ON "AppointmentStatusEvent"("toStatus", "occurredAt");
