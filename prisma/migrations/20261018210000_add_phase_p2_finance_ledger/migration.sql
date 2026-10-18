-- Phase P2: Finance Ledger, Expenses, Commission Payouts, and Reversal Types

ALTER TABLE "PaymentReversal" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'RECORD_CORRECTION';

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "amountCents" INTEGER NOT NULL,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "paidById" TEXT,
    "canceledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Expense_competenceDate_status_idx" ON "Expense"("competenceDate", "status");
CREATE INDEX IF NOT EXISTS "Expense_dueDate_status_idx" ON "Expense"("dueDate", "status");
CREATE INDEX IF NOT EXISTS "Expense_paidAt_status_idx" ON "Expense"("paidAt", "status");
CREATE INDEX IF NOT EXISTS "Expense_category_competenceDate_idx" ON "Expense"("category", "competenceDate");

CREATE TABLE IF NOT EXISTS "CommissionPayout" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "paidById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPayout_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommissionPayout_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommissionPayout_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommissionPayout_barberId_paidAt_idx" ON "CommissionPayout"("barberId", "paidAt");
CREATE INDEX IF NOT EXISTS "CommissionPayout_status_paidAt_idx" ON "CommissionPayout"("status", "paidAt");

CREATE TABLE IF NOT EXISTS "FinancialMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "appointmentId" TEXT,
    "receiptId" TEXT,
    "expenseId" TEXT,
    "payoutId" TEXT,
    "actorId" TEXT NOT NULL,
    "idempotencyKey" TEXT,

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinancialMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialMovement_idempotencyKey_key" ON "FinancialMovement"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialMovement_occurredAt_type_idx" ON "FinancialMovement"("occurredAt", "type");
CREATE INDEX IF NOT EXISTS "FinancialMovement_receiptId_idx" ON "FinancialMovement"("receiptId");
CREATE INDEX IF NOT EXISTS "FinancialMovement_expenseId_idx" ON "FinancialMovement"("expenseId");
CREATE INDEX IF NOT EXISTS "FinancialMovement_payoutId_idx" ON "FinancialMovement"("payoutId");
