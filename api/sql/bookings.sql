-- ═══════════════════════════════════════════
-- iRUS — bookings table
-- Maps to: /booking/ page (4-step wizard)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `bookings` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Step 01 — Your details
  `first_name`       VARCHAR(30)   NOT NULL,
  `last_name`        VARCHAR(30)   NOT NULL,
  `age`              TINYINT UNSIGNED NOT NULL,
  `gender`           ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
  `phone`            VARCHAR(20)   NOT NULL,
  `email`            VARCHAR(100)  NOT NULL,
  `country`          VARCHAR(100)  NULL,
  `city`             VARCHAR(100)  NULL,

  -- Step 02 — Concern
  `consult_type`     VARCHAR(100)  NOT NULL DEFAULT 'General consultation',
  `diagnosed`        ENUM('Yes', 'No', 'Not sure') NOT NULL DEFAULT 'No',
  `mode`             ENUM('In person', 'Video call') NOT NULL DEFAULT 'In person',
  `concern`          TEXT          NULL,

  -- Step 03 — Date & time
  `appointment_date` DATE          NOT NULL,
  `appointment_time` VARCHAR(10)   NOT NULL,

  -- Meta
  `booking_ref`      VARCHAR(20)   NOT NULL,
  `status`           ENUM('new', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'new',
  `ip_address`       VARCHAR(45)   NULL,
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_booking_ref`      (`booking_ref`),
  INDEX        `idx_status`            (`status`),
  INDEX        `idx_appointment_date`  (`appointment_date`),
  INDEX        `idx_created_at`        (`created_at` DESC),
  INDEX        `idx_email`             (`email`),
  INDEX        `idx_phone`             (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
