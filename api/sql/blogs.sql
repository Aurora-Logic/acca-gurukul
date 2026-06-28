-- ═══════════════════════════════════════════
-- ACCA — blogs table
-- Used by /admin/blog (admin panel blogs CRUD)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `blogs` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`            VARCHAR(255) NOT NULL,
  `slug`             VARCHAR(255) NOT NULL,
  `excerpt`          TEXT,
  `content`          LONGTEXT NOT NULL,
  `featured_image`   VARCHAR(255),
  `featured_image_alt` VARCHAR(255),
  `category`         VARCHAR(100),
  `tags`             VARCHAR(255),
  `meta_title`       VARCHAR(255),
  `meta_description` VARCHAR(500),
  `og_title`         VARCHAR(255),
  `og_description`   VARCHAR(500),
  `author`           VARCHAR(255) NULL,
  `read_time`        INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published`     TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured`      TINYINT(1) NOT NULL DEFAULT 0,
  `show_toc`         TINYINT(1) NOT NULL DEFAULT 1,
  `faqs`             TEXT,
  `views`            INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slug` (`slug`),
  INDEX `idx_is_published` (`is_published`),
  INDEX `idx_is_featured` (`is_featured`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════
-- ACCA — blog_views table
-- Used to track unique views by IP & User Agent
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `blog_views` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `blog_id`    INT UNSIGNED NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) NOT NULL,
  `viewed_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_view` (`blog_id`, `ip_address`, `user_agent`),
  CONSTRAINT `fk_blog_views_blog_id` FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
