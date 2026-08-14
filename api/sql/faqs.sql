CREATE TABLE IF NOT EXISTS `faqs` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question`   VARCHAR(255) NOT NULL,
  `answer`     TEXT NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `order_idx`  INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX      `idx_is_active` (`is_active`),
  INDEX      `idx_order` (`order_idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════
-- Starter FAQs
--
-- The homepage FAQ section renders these server-side and emits FAQPage
-- structured data from them, so an empty table means an empty section and no
-- rich result. These are safe defaults — edit or replace them from /admin/faq.
-- ═══════════════════════════════════════════

INSERT INTO `faqs` (`question`, `answer`, `is_active`, `order_idx`)
SELECT * FROM (
  SELECT
    'What is the ACCA qualification and who is it for?' AS q,
    'ACCA (Association of Chartered Certified Accountants) is a globally recognised accounting qualification accepted in over 180 countries. It suits students after Class 12, commerce graduates, and working professionals who want a career in audit, taxation, financial reporting or corporate finance.' AS a,
    1 AS act, 1 AS ord
  UNION ALL SELECT
    'How long does it take to complete ACCA?',
    'Most students complete ACCA in two to three years. The exact duration depends on how many exemptions you receive and how many papers you attempt in each of the four annual exam sittings.',
    1, 2
  UNION ALL SELECT
    'What exemptions can I get for ACCA?',
    'Exemptions depend on your prior qualification. B.Com graduates typically receive up to four exemptions, while qualified CAs and IPCC candidates may receive more. We assess your transcripts during counselling and confirm your exact exemptions before you enrol.',
    1, 3
  UNION ALL SELECT
    'What are the eligibility requirements to start ACCA?',
    'You can begin the ACCA qualification after Class 12 with passes in Mathematics or Accounts and English. Students who do not meet these requirements can start through the FIA (Foundations in Accountancy) route and progress into the main ACCA programme.',
    1, 4
  UNION ALL SELECT
    'Does ACCA Gurukul provide placement support?',
    'Yes. Our placement cell supports enrolled students with CV building, interview preparation and introductions to recruiting firms, including Big 4 and multinational finance teams.',
    1, 5
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `faqs` LIMIT 1);
