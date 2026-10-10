-- Also accommodates installations previously updated with db push.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Service" ALTER COLUMN "price" TYPE DECIMAL(12,2) USING ROUND("price"::numeric, 2);
ALTER TABLE "Service" ALTER COLUMN "commissionRate" TYPE DECIMAL(5,4) USING ROUND("commissionRate"::numeric, 4);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "reminded24h" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "reminded1h" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "reminded15m" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "remindedStart" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "commissionCents" INTEGER;
-- Original prices cannot be recovered: backfill uses the current catalog.
UPDATE "Appointment" a SET
  "priceCents" = COALESCE(a."priceCents", ROUND(s.price * 100)::integer),
  "commissionCents" = COALESCE(a."commissionCents", ROUND(s.price * s."commissionRate" * 100)::integer)
FROM "Service" s WHERE s.id = a."serviceId" AND (a."priceCents" IS NULL OR a."commissionCents" IS NULL);
ALTER TABLE "Appointment" ALTER COLUMN "priceCents" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "commissionCents" SET NOT NULL;
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'INFO', "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Appointment_barberId_startTime_endTime_idx" ON "Appointment"("barberId", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "Appointment_clientId_startTime_idx" ON "Appointment"("clientId", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_status_startTime_idx" ON "Appointment"("status", "startTime");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
