-- ═══════════════════════════════════════════
-- ACCA Gurukul — SEO tables
--
-- Replaces the previous approach of regex-rewriting live HTML files, which
-- lost every admin edit on deploy and could corrupt a page on concurrent
-- writes. SEO now lives in the database and is rendered by components/head.php.
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `page_seo` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `page_key`         VARCHAR(64)  NOT NULL,          -- stable identifier used in code
  `path`             VARCHAR(191) NOT NULL,          -- public URL path, e.g. "/about-us/"
  `label`            VARCHAR(120) NOT NULL,          -- human name shown in the admin list

  -- Core meta
  `meta_title`       VARCHAR(255) NULL,
  `meta_description` VARCHAR(320) NULL,
  `meta_keywords`    VARCHAR(255) NULL,
  `canonical_url`    VARCHAR(255) NULL,              -- absolute; blank = derive from path

  -- Open Graph / social
  `og_title`         VARCHAR(255) NULL,
  `og_description`   VARCHAR(320) NULL,
  `og_image`         VARCHAR(255) NULL,
  `og_type`          VARCHAR(40)  NOT NULL DEFAULT 'website',
  `twitter_card`     VARCHAR(40)  NOT NULL DEFAULT 'summary_large_image',

  -- Indexing directives
  `robots_noindex`   TINYINT(1)   NOT NULL DEFAULT 0,
  `robots_nofollow`  TINYINT(1)   NOT NULL DEFAULT 0,

  -- JSON-LD injected in addition to the sitewide Organization graph
  `structured_data`  LONGTEXT     NULL,

  -- Sitemap controls
  `in_sitemap`       TINYINT(1)   NOT NULL DEFAULT 1,
  `sitemap_priority` DECIMAL(2,1) NOT NULL DEFAULT 0.8,
  `sitemap_freq`     VARCHAR(20)  NOT NULL DEFAULT 'monthly',

  `sort_order`       INT          NOT NULL DEFAULT 0,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_page_key` (`page_key`),
  INDEX `idx_in_sitemap` (`in_sitemap`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════
-- Sitewide SEO / organisation identity
-- Single row (id = 1). Feeds the Organization + LocalBusiness JSON-LD graph
-- that every page inherits, plus robots.txt.
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,

  `site_name`           VARCHAR(120) NOT NULL DEFAULT 'ACCA Gurukul',
  `site_url`            VARCHAR(191) NOT NULL DEFAULT 'https://accagurukul.com',
  `default_og_image`    VARCHAR(255) NULL,
  `title_separator`     VARCHAR(10)  NOT NULL DEFAULT '|',
  `title_suffix`        VARCHAR(120) NOT NULL DEFAULT 'ACCA Gurukul',

  -- Organisation identity (schema.org)
  `org_legal_name`      VARCHAR(191) NULL,
  `org_logo`            VARCHAR(255) NULL,
  `org_description`     VARCHAR(500) NULL,
  `org_phone`           VARCHAR(40)  NULL,
  `org_email`           VARCHAR(120) NULL,
  `org_street`          VARCHAR(191) NULL,
  `org_locality`        VARCHAR(120) NULL,
  `org_region`          VARCHAR(120) NULL,
  `org_postal_code`     VARCHAR(20)  NULL,
  `org_country`         VARCHAR(10)  NOT NULL DEFAULT 'IN',
  `org_latitude`        VARCHAR(30)  NULL,
  `org_longitude`       VARCHAR(30)  NULL,
  `org_founding_date`   VARCHAR(20)  NULL,
  `org_price_range`     VARCHAR(20)  NULL,
  `org_opening_hours`   VARCHAR(255) NULL,

  -- sameAs profiles for the knowledge graph
  `social_facebook`     VARCHAR(255) NULL,
  `social_instagram`    VARCHAR(255) NULL,
  `social_linkedin`     VARCHAR(255) NULL,
  `social_youtube`      VARCHAR(255) NULL,
  `social_twitter`      VARCHAR(255) NULL,
  `twitter_handle`      VARCHAR(60)  NULL,

  -- Search console / webmaster verification
  `google_verification` VARCHAR(191) NULL,
  `bing_verification`   VARCHAR(191) NULL,

  -- robots.txt body, served dynamically by /robots.txt
  `robots_txt`          TEXT         NULL,

  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════
-- Seed: sitewide defaults
-- ═══════════════════════════════════════════

INSERT INTO `seo_settings`
  (`id`, `site_name`, `site_url`, `default_og_image`, `title_suffix`,
   `org_legal_name`, `org_logo`, `org_description`,
   `org_phone`, `org_email`, `org_locality`, `org_region`, `org_country`,
   `org_price_range`, `robots_txt`)
SELECT
  1,
  'ACCA Gurukul',
  'https://accagurukul.com',
  '/assets/images/building.webp',
  'ACCA Gurukul',
  'ACCA Gurukul',
  '/logo.png',
  'ACCA Gurukul is a specialist ACCA and FIA training institute helping students build global finance careers through expert mentorship, structured coaching and placement support.',
  '+91 8692 009 002',
  'contact@accagurukul.com',
  'Mumbai',
  'Maharashtra',
  'IN',
  '$$',
  'User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/\nDisallow: /uploads/blogs/tmp/\n\nSitemap: https://accagurukul.com/sitemap.xml'
WHERE NOT EXISTS (SELECT 1 FROM `seo_settings` WHERE `id` = 1);


-- ═══════════════════════════════════════════
-- Seed: one row per public page
-- Titles/descriptions carried over from the hand-written HTML so nothing
-- regresses on first deploy; the admin can refine them from /admin/seo.
-- ═══════════════════════════════════════════

INSERT IGNORE INTO `page_seo`
  (`page_key`, `path`, `label`, `meta_title`, `meta_description`,
   `in_sitemap`, `sitemap_priority`, `sitemap_freq`, `sort_order`)
VALUES
  ('home', '/', 'Home',
   'ACCA Gurukul | Building Global Finance Leaders',
   'Specialist ACCA & FIA coaching with expert mentors, structured classes, mock tests and placement support. Build your global finance career.',
   1, 1.0, 'daily', 1),

  ('acca-course', '/acca-course/', 'ACCA Course',
   'ACCA Course 2026 | Fees, Syllabus, Duration & Eligibility',
   'Complete ACCA course guide — all 13 papers, fee structure, exemptions, eligibility and the full exam schedule, explained simply.',
   1, 0.9, 'weekly', 2),

  ('fia', '/fia/', 'FIA Route',
   'ACCA FIA Route | Foundations in Accountancy Course',
   'Begin your finance career early with the ACCA FIA route — ideal for Class 10 to 12 students building strong accounting foundations.',
   1, 0.8, 'monthly', 3),

  ('about-us', '/about-us/', 'About Us',
   'About ACCA Gurukul | Building Future-Ready Finance Leaders',
   'Meet the mentors behind ACCA Gurukul — our teaching approach, student results and the support that turns learners into finance professionals.',
   1, 0.8, 'monthly', 4),

  ('student-zone', '/student-zone/', 'Student Zone',
   'Student Zone | Academic Support & Placement Assistance',
   'Everything enrolled students get at ACCA Gurukul: academic mentoring, doubt-solving, mock tests, performance tracking and dedicated placement support.',
   1, 0.8, 'weekly', 5),

  ('resources', '/resources/', 'Study Resources',
   'Free ACCA Study Resources | Notes, Mock Tests & Exam Guides',
   'Download free ACCA study material — chapter notes, revision kits, mock test papers and exam strategy guides curated by ACCA Gurukul faculty.',
   1, 0.8, 'weekly', 6),

  ('locations', '/locations/', 'Our Locations',
   'ACCA Coaching Centres in Nashik, Nagpur & Mumbai | ACCA Gurukul',
   'ACCA Gurukul has learning centres in Nashik, Nagpur and Mumbai. Find addresses, contact numbers and directions for every location.',
   1, 0.8, 'monthly', 7),

  ('blogs', '/blogs/', 'Blog',
   'ACCA Blog | Exam Strategy, Career Guides & Syllabus Updates',
   'Curated ACCA exam strategies, global career insights, syllabus updates and alumni success stories from the mentors at ACCA Gurukul.',
   1, 0.9, 'daily', 8),

  ('contact-us', '/contact-us/', 'Contact Us',
   'Contact ACCA Gurukul | Book a Free Counselling Session',
   'Have a question about ACCA? Contact the ACCA Gurukul team today and book your free one-on-one academic counselling session.',
   1, 0.8, 'monthly', 9),

  ('privacy-policy', '/privacy-policy/', 'Privacy Policy',
   'Privacy Policy | ACCA Gurukul Data Protection',
   'How ACCA Gurukul collects, uses, stores and protects your personal information, and the choices available to you.',
   1, 0.3, 'yearly', 10),

  ('terms-of-service', '/terms-of-service/', 'Terms of Service',
   'Terms of Service | ACCA Gurukul Website Terms',
   'The terms and conditions that govern your use of the ACCA Gurukul website, courses and related services.',
   1, 0.3, 'yearly', 11),

  ('disclaimer', '/disclaimer/', 'Disclaimer',
   'Disclaimer | ACCA Gurukul Course Information',
   'Important disclaimers regarding course information, results, third-party content and the ACCA trademark on this website.',
   1, 0.3, 'yearly', 12);


-- ═══════════════════════════════════════════
-- Course structured data
--
-- Google's Course rich result needs name, description and provider at minimum;
-- hasCourseInstance (with courseMode + courseWorkload) and offers are what make
-- a page eligible for the Course Info carousel. Editable from /admin/seo.
-- ═══════════════════════════════════════════

UPDATE `page_seo` SET `structured_data` = '{
  "@type": "Course",
  "name": "ACCA Qualification",
  "description": "The full ACCA qualification covering Applied Knowledge, Applied Skills and Strategic Professional, delivered with classroom and online coaching, mock exams and mentor support.",
  "provider": { "@type": "Organization", "name": "ACCA Gurukul", "sameAs": "https://accagurukul.com" },
  "educationalCredentialAwarded": "ACCA Membership",
  "coursePrerequisites": "Completion of Class 12 with Mathematics or Accounts and English",
  "hasCourseInstance": [{
    "@type": "CourseInstance",
    "courseMode": ["Onsite", "Online"],
    "courseWorkload": "PT12H",
    "courseSchedule": {
      "@type": "Schedule",
      "repeatFrequency": "Weekly",
      "repeatCount": 52
    }
  }],
  "offers": [{ "@type": "Offer", "category": "Paid", "priceCurrency": "INR", "availability": "https://schema.org/InStock" }]
}' WHERE `page_key` = 'acca-course';

UPDATE `page_seo` SET `structured_data` = '{
  "@type": "Course",
  "name": "ACCA Foundations in Accountancy (FIA)",
  "description": "The FIA entry route into ACCA for students in Class 10 to 12, building core bookkeeping, management accounting and financial accounting skills before the main ACCA papers.",
  "provider": { "@type": "Organization", "name": "ACCA Gurukul", "sameAs": "https://accagurukul.com" },
  "educationalCredentialAwarded": "ACCA Diploma in Accounting and Business",
  "hasCourseInstance": [{
    "@type": "CourseInstance",
    "courseMode": ["Onsite", "Online"],
    "courseWorkload": "PT8H"
  }],
  "offers": [{ "@type": "Offer", "category": "Paid", "priceCurrency": "INR", "availability": "https://schema.org/InStock" }]
}' WHERE `page_key` = 'fia';
