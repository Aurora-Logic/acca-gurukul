<?php
/**
 * Served at /robots.txt via .htaccess.
 *
 * The body is editable from the admin panel (SEO → Settings) so crawl rules can
 * be changed without a deploy. A hardcoded fallback covers the case where the
 * database is unreachable — returning nothing would leave crawlers with no
 * sitemap pointer at all.
 */

require_once __DIR__ . '/components/seo.php';

header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');

$settings = seo_settings();
$body     = trim((string) ($settings['robots_txt'] ?? ''));

if ($body === '') {
    $body = "User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/";
}

// Guarantee the sitemap pointer regardless of what the admin saved — this is
// the single most important line in the file for getting pages discovered.
if (stripos($body, 'sitemap:') === false) {
    $body .= "\n\nSitemap: " . seo_url('/sitemap.xml');
}

echo $body . "\n";
