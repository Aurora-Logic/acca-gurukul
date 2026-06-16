-- ═══════════════════════════════════════════
-- ACCA — contacts table
-- Maps to: /contact/ page form
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `contacts` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(60)     NOT NULL,
  `phone`      VARCHAR(20)     NOT NULL,
  `email`      VARCHAR(100)    NOT NULL,
  `topic`      VARCHAR(100)    NOT NULL DEFAULT 'General consultation',
  `message`    TEXT            NULL,
  `is_read`    TINYINT(1)      NOT NULL DEFAULT 0,
  `ip_address` VARCHAR(45)     NULL,
  `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_is_read`    (`is_read`),
  INDEX `idx_created_at` (`created_at` DESC),
  INDEX `idx_email`      (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
