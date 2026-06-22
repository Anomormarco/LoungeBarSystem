-- CreateTable
CREATE TABLE `organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `exterior_images` JSON NULL,
    `interior_images` JSON NULL,
    `opening_time` VARCHAR(5) NOT NULL,
    `closing_time` VARCHAR(5) NOT NULL,
    `subscription_status` ENUM('active', 'expired', 'disabled') NOT NULL DEFAULT 'expired',
    `subscription_expiry` DATETIME(3) NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `organizations_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `organizations_subscription_status_idx`(`subscription_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NULL,
    `role` ENUM('manager', 'waiter', 'cashier') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `staff_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `staff_organization_id_email_key`(`organization_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `table_number` VARCHAR(50) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `type` ENUM('normal', 'vip') NOT NULL DEFAULT 'normal',
    `status` ENUM('available', 'reserved', 'occupied', 'disabled', 'custom') NOT NULL DEFAULT 'available',
    `custom_status_label` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tables_organization_id_status_idx`(`organization_id`, `status`),
    UNIQUE INDEX `tables_organization_id_table_number_key`(`organization_id`, `table_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `image` VARCHAR(500) NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `menu_items_organization_id_category_idx`(`organization_id`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `table_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `guest_name` VARCHAR(191) NOT NULL,
    `guest_phone` VARCHAR(30) NOT NULL,
    `guest_email` VARCHAR(191) NOT NULL,
    `reservation_date` DATE NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `guest_count` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'expired') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reservations_organization_id_reservation_date_idx`(`organization_id`, `reservation_date`),
    INDEX `reservations_table_id_reservation_date_start_time_end_time_idx`(`table_id`, `reservation_date`, `start_time`, `end_time`),
    INDEX `reservations_guest_email_idx`(`guest_email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `reservation_id` INTEGER NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_codes_email_code_idx`(`email`, `code`),
    INDEX `verification_codes_reservation_id_idx`(`reservation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_organization_id_is_read_idx`(`organization_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `plan_type` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('stripe', 'qpay') NOT NULL,
    `payment_status` ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscriptions_organization_id_payment_status_idx`(`organization_id`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('super_admin', 'staff_admin') NOT NULL DEFAULT 'staff_admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_codes` ADD CONSTRAINT `verification_codes_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
