-- ═══════════════════════════════════════════
-- admins table
-- Used by /login (admin panel authentication)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `admins` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(60)  NOT NULL,
  `email`      VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,          -- stores password_hash() output (bcrypt / argon2)
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`),
  INDEX      `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════
-- Seed the first admin
-- ═══════════════════════════════════════════
--
-- 1. Generate a bcrypt hash of your password (run in terminal):
--      php -r "echo password_hash('your-password-here', PASSWORD_BCRYPT);"
--
-- 2. Copy the output (starts with $2y$10$...) and paste into the INSERT below.
--
-- 3. Run it in phpMyAdmin:
--
-- INSERT INTO `admins` (`name`, `email`, `password`)
-- VALUES ('Admin', 'admin@ACCA.in',
--         '$2y$10$PUT_BCRYPT_HASH_HERE');
--
-- Never store plaintext passwords — always use password_hash() to generate the
-- value and password_verify() to check it at login time.
