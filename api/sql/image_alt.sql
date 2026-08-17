-- ═══════════════════════════════════════════
-- ACCA Gurukul — image alt text
--
-- Alt text used to be hardcoded in the page templates, so it could only be
-- changed by editing files. Rows here override the template value at render
-- time; the template text stays as the fallback, which means a missing row
-- degrades to the current wording rather than to an empty alt.
--
-- Blog images are NOT managed here — those already carry their own alt text
-- (blogs.featured_image_alt) edited alongside the post.
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `image_alt` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,

  `image_key`     VARCHAR(191) NOT NULL,   -- site-relative src, e.g. /assets/images/building.webp
  `alt_text`      VARCHAR(300) NULL,       -- admin override; NULL falls back to default_alt
  `default_alt`   VARCHAR(300) NULL,       -- wording originally written in the template
  `location`      VARCHAR(120) NOT NULL,   -- where it appears, for grouping in the admin list

  -- Purely decorative images should carry alt="" so screen readers skip them.
  -- That is different from "no alt set", which makes readers announce the
  -- filename, so it needs its own flag rather than an empty string.
  `is_decorative` TINYINT(1)   NOT NULL DEFAULT 0,

  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_image_key` (`image_key`),
  INDEX `idx_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
