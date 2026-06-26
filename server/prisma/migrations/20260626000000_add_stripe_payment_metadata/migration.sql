ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" VARCHAR(191),
ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" VARCHAR(191),
ADD COLUMN IF NOT EXISTS "stripe_subscription_id" VARCHAR(191),
ADD COLUMN IF NOT EXISTS "stripe_customer_id" VARCHAR(191),
ADD COLUMN IF NOT EXISTS "stripe_invoice_id" VARCHAR(191),
ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;

CREATE INDEX IF NOT EXISTS "subscriptions_stripe_checkout_session_id_idx" ON "subscriptions"("stripe_checkout_session_id");
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_payment_intent_id_idx" ON "subscriptions"("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");
