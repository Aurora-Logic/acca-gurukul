<?php
/**
 * POST /api/admin/seo/update.php
 * Saves one page's SEO record.
 *
 * This replaces an earlier version that regex-rewrote live .html files on disk.
 * That version shipped without a requireAuth() call, so any anonymous request
 * could rewrite <title> and inject a <script> into a public page. It also lost
 * every edit on deploy. SEO is now database-only — nothing here touches the
 * filesystem, and structured_data is parsed as JSON rather than concatenated
 * into markup.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$data = getJsonBody();

$pageKey = trim((string) ($data['page_key'] ?? ''));
if ($pageKey === '') {
    jsonError('page_key is required', 422);
}

try {
    $stmt = db()->prepare('SELECT id FROM `page_seo` WHERE page_key = :k LIMIT 1');
    $stmt->execute([':k' => $pageKey]);
    if (!$stmt->fetchColumn()) {
        jsonError('Page not found', 404);
    }
} catch (PDOException $e) {
    error_log('seo/update lookup error: ' . $e->getMessage());
    jsonError('Failed to save SEO', 500);
}

/** Trim a field, clamp it to the column width, and treat empty as NULL. */
$str = function (string $field, int $max) use ($data): ?string {
    $value = trim((string) ($data[$field] ?? ''));
    return $value === '' ? null : mb_substr($value, 0, $max);
};

$metaTitle       = $str('meta_title', 255);
$metaDescription = $str('meta_description', 320);
$metaKeywords    = $str('meta_keywords', 255);
$canonicalUrl    = $str('canonical_url', 255);
$ogTitle         = $str('og_title', 255);
$ogDescription   = $str('og_description', 320);
$ogImage         = $str('og_image', 255);

// A canonical that points somewhere unresolvable is worse than none at all.
if ($canonicalUrl !== null && !filter_var($canonicalUrl, FILTER_VALIDATE_URL)) {
    jsonError('Canonical URL must be a full absolute URL (https://…)', 422, ['canonical_url' => 'Invalid URL']);
}

$allowedOgTypes = ['website', 'article', 'profile', 'book', 'video.other'];
$ogType = (string) ($data['og_type'] ?? 'website');
if (!in_array($ogType, $allowedOgTypes, true)) {
    $ogType = 'website';
}

$allowedCards = ['summary', 'summary_large_image', 'app', 'player'];
$twitterCard = (string) ($data['twitter_card'] ?? 'summary_large_image');
if (!in_array($twitterCard, $allowedCards, true)) {
    $twitterCard = 'summary_large_image';
}

$allowedFreq = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
$sitemapFreq = (string) ($data['sitemap_freq'] ?? 'monthly');
if (!in_array($sitemapFreq, $allowedFreq, true)) {
    $sitemapFreq = 'monthly';
}

$priority = (float) ($data['sitemap_priority'] ?? 0.8);
$priority = max(0.0, min(1.0, round($priority, 1)));

// Validated here so a syntax error surfaces in the editor rather than silently
// dropping the block at render time.
$structured = trim((string) ($data['structured_data'] ?? ''));
if ($structured !== '') {
    $decoded = json_decode($structured, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        jsonError('Structured data must be valid JSON', 422, [
            'structured_data' => 'Invalid JSON: ' . json_last_error_msg(),
        ]);
    }
    $structured = json_encode($decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} else {
    $structured = null;
}

try {
    db()->prepare('
        UPDATE `page_seo` SET
            meta_title       = :meta_title,
            meta_description = :meta_description,
            meta_keywords    = :meta_keywords,
            canonical_url    = :canonical_url,
            og_title         = :og_title,
            og_description   = :og_description,
            og_image         = :og_image,
            og_type          = :og_type,
            twitter_card     = :twitter_card,
            robots_noindex   = :robots_noindex,
            robots_nofollow  = :robots_nofollow,
            structured_data  = :structured_data,
            in_sitemap       = :in_sitemap,
            sitemap_priority = :sitemap_priority,
            sitemap_freq     = :sitemap_freq
        WHERE page_key = :page_key
    ')->execute([
        ':meta_title'       => $metaTitle,
        ':meta_description' => $metaDescription,
        ':meta_keywords'    => $metaKeywords,
        ':canonical_url'    => $canonicalUrl,
        ':og_title'         => $ogTitle,
        ':og_description'   => $ogDescription,
        ':og_image'         => $ogImage,
        ':og_type'          => $ogType,
        ':twitter_card'     => $twitterCard,
        ':robots_noindex'   => !empty($data['robots_noindex']) ? 1 : 0,
        ':robots_nofollow'  => !empty($data['robots_nofollow']) ? 1 : 0,
        ':structured_data'  => $structured,
        ':in_sitemap'       => !empty($data['in_sitemap']) ? 1 : 0,
        ':sitemap_priority' => $priority,
        ':sitemap_freq'     => $sitemapFreq,
        ':page_key'         => $pageKey,
    ]);
} catch (PDOException $e) {
    error_log('seo/update error: ' . $e->getMessage());
    jsonError('Failed to save SEO', 500);
}

jsonSuccess('SEO settings saved');
