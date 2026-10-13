-- AlterTable: Make clientId optional, add clientContactId, origin and createdById
ALTER TABLE "Appointment" ALTER COLUMN "clientId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "clientContactId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- CreateTable Receptionist
CREATE TABLE IF NOT EXISTS "Receptionist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receptionist_pkey" PRIMARY KEY ("id")
);

-- CreateTable ClientContact
CREATE TABLE IF NOT EXISTS "ClientContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaymentReceipt
CREATE TABLE IF NOT EXISTS "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "confirmedById" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaymentReversal
CREATE TABLE IF NOT EXISTS "PaymentReversal" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "revertedById" TEXT NOT NULL,
    "revertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReversal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Receptionist_userId_key" ON "Receptionist"("userId");
CREATE INDEX IF NOT EXISTS "ClientContact_name_idx" ON "ClientContact"("name");
CREATE INDEX IF NOT EXISTS "ClientContact_phone_idx" ON "ClientContact"("phone");
CREATE INDEX IF NOT EXISTS "Appointment_clientContactId_startTime_idx" ON "Appointment"("clientContactId", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_createdById_idx" ON "Appointment"("createdById");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReceipt_appointmentId_key" ON "PaymentReceipt"("appointmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReceipt_idempotencyKey_key" ON "PaymentReceipt"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentReceipt_confirmedAt_idx" ON "PaymentReceipt"("confirmedAt");
CREATE INDEX IF NOT EXISTS "PaymentReceipt_method_confirmedAt_idx" ON "PaymentReceipt"("method", "confirmedAt");
CREATE INDEX IF NOT EXISTS "PaymentReceipt_status_confirmedAt_idx" ON "PaymentReceipt"("status", "confirmedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReversal_receiptId_key" ON "PaymentReversal"("receiptId");
CREATE INDEX IF NOT EXISTS "PaymentReversal_revertedAt_idx" ON "PaymentReversal"("revertedAt");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receptionist_userId_fkey') THEN
        ALTER TABLE "Receptionist" ADD CONSTRAINT "Receptionist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_clientContactId_fkey') THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientContactId_fkey" FOREIGN KEY ("clientContactId") REFERENCES "ClientContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_createdById_fkey') THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReceipt_appointmentId_fkey') THEN
        ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReceipt_confirmedById_fkey') THEN
        ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReversal_receiptId_fkey') THEN
        ALTER TABLE "PaymentReversal" ADD CONSTRAINT "PaymentReversal_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentReversal_revertedById_fkey') THEN
        ALTER TABLE "PaymentReversal" ADD CONSTRAINT "PaymentReversal_revertedById_fkey" FOREIGN KEY ("revertedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
