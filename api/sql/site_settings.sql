-- ACCA Gurukul — Site Settings Table for Tracking Tags & Analytics
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `google_tag_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
  `google_tag_id`           VARCHAR(100) NULL,
  `google_tag_script`       TEXT NULL,
  `meta_pixel_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
  `meta_pixel_id`           VARCHAR(100) NULL,
  `meta_pixel_script`       TEXT NULL,
  `custom_head_script`      TEXT NULL,
  `custom_body_script`      TEXT NULL,
  `updated_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default settings row if table is empty
INSERT INTO `site_settings` (`id`, `google_tag_enabled`, `meta_pixel_enabled`)
SELECT 1, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM `site_settings` WHERE `id` = 1);
