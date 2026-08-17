<?php
/**
 * Served at /sitemap.xml.
 *
 * Generated on request from the same `page_seo` rows the admin panel edits, so
 * a page can never be live on the site but missing from the sitemap. The
 * generation itself lives in components/sitemap.php, shared with the admin
 * preview.
 */

require_once __DIR__ . '/components/sitemap.php';

header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');

echo sitemapXml() . PHP_EOL;
