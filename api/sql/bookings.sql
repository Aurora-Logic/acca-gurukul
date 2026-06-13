-- ═══════════════════════════════════════════
-- ACCA — bookings table
-- Maps to: /booking/ page (4-step wizard)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `bookings` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Student details
  `name`             VARCHAR(100)  NOT NULL,
  `phone`            VARCHAR(20)   NOT NULL,
  `email`            VARCHAR(100)  NOT NULL,

  -- Counselling preferences
  `course`           VARCHAR(100)  NOT NULL,
  `qualification`    VARCHAR(100)  NOT NULL,
  `year_of_passing`  VARCHAR(20)   NULL,
  `location`         VARCHAR(100)  NOT NULL,
  
  -- Date & time
  `appointment_date` DATE          NOT NULL,
  `appointment_time` VARCHAR(20)   NOT NULL,

  -- Additional Info
  `source`           VARCHAR(100)  NULL,
  `message`          TEXT          NULL,

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
