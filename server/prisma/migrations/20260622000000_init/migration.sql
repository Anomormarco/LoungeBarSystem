-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'disabled');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('manager', 'waiter', 'cashier');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('normal', 'vip');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('available', 'reserved', 'occupied', 'disabled', 'custom');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe', 'qpay');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'staff_admin');

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10, 7) NOT NULL,
    "longitude" DECIMAL(10, 7) NOT NULL,
    "phone" VARCHAR(30),
    "exterior_images" JSONB,
    "interior_images" JSONB,
    "opening_time" VARCHAR(5) NOT NULL,
    "closing_time" VARCHAR(5) NOT NULL,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'expired',
    "subscription_expiry" TIMESTAMP(3),
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(191) NOT NULL,
    "password" VARCHAR(255),
    "role" "StaffRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "table_number" VARCHAR(50) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" "TableType" NOT NULL DEFAULT 'normal',
    "status" "TableStatus" NOT NULL DEFAULT 'available',
    "custom_status_label" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "image" VARCHAR(500),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "table_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "guest_name" VARCHAR(191) NOT NULL,
    "guest_phone" VARCHAR(30) NOT NULL,
    "guest_email" VARCHAR(191) NOT NULL,
    "reservation_date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "guest_count" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "reservation_id" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "title" VARCHAR(191) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "plan_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'staff_admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_latitude_longitude_idx" ON "organizations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "organizations_subscription_status_idx" ON "organizations"("subscription_status");

-- CreateIndex
CREATE INDEX "staff_organization_id_idx" ON "staff"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_organization_id_email_key" ON "staff"("organization_id", "email");

-- CreateIndex
CREATE INDEX "tables_organization_id_status_idx" ON "tables"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tables_organization_id_table_number_key" ON "tables"("organization_id", "table_number");

-- CreateIndex
CREATE INDEX "menu_items_organization_id_category_idx" ON "menu_items"("organization_id", "category");

-- CreateIndex
CREATE INDEX "reservations_organization_id_reservation_date_idx" ON "reservations"("organization_id", "reservation_date");

-- CreateIndex
CREATE INDEX "reservations_table_id_reservation_date_start_time_end_time_idx" ON "reservations"("table_id", "reservation_date", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "reservations_guest_email_idx" ON "reservations"("guest_email");

-- CreateIndex
CREATE INDEX "verification_codes_email_code_idx" ON "verification_codes"("email", "code");

-- CreateIndex
CREATE INDEX "verification_codes_reservation_id_idx" ON "verification_codes"("reservation_id");

-- CreateIndex
CREATE INDEX "notifications_organization_id_is_read_idx" ON "notifications"("organization_id", "is_read");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_payment_status_idx" ON "subscriptions"("organization_id", "payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
