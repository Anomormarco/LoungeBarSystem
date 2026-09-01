ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "qpay_invoice_id" VARCHAR(191);

CREATE INDEX IF NOT EXISTS "subscriptions_qpay_invoice_id_idx" ON "subscriptions"("qpay_invoice_id");
