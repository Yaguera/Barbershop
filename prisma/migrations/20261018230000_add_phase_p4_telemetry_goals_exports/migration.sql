-- Phase P4: Internal Telemetry Events, Booking Funnel, Management Goals, and Export Audit

CREATE TABLE IF NOT EXISTS "InternalTelemetryEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "journeyId" TEXT,
    "channel" TEXT,
    "actorRole" TEXT,
    "appointmentId" TEXT,
    "serviceId" TEXT,
    "barberId" TEXT,
    "amountCents" INTEGER,
    "metadataJson" TEXT,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalTelemetryEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InternalTelemetryEvent_idempotencyKey_key" ON "InternalTelemetryEvent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "InternalTelemetryEvent_eventName_occurredAt_idx" ON "InternalTelemetryEvent"("eventName", "occurredAt");
CREATE INDEX IF NOT EXISTS "InternalTelemetryEvent_journeyId_eventName_idx" ON "InternalTelemetryEvent"("journeyId", "eventName");

CREATE TABLE IF NOT EXISTS "ManagementGoal" (
    "id" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "barberId" TEXT NOT NULL DEFAULT 'ALL',
    "targetValue" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagementGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ManagementGoal_metricCode_monthKey_barberId_key" ON "ManagementGoal"("metricCode", "monthKey", "barberId");
CREATE INDEX IF NOT EXISTS "ManagementGoal_monthKey_idx" ON "ManagementGoal"("monthKey");
