<?php
/**
 * Sitemap generation, shared by the public /sitemap.xml route and the admin
 * preview so the two can never disagree about what is listed.
 */

require_once __DIR__ . '/seo.php';

/**
 * Every URL that belongs in the sitemap.
 *
 * Pages flagged noindex are excluded: listing a URL you simultaneously tell
 * Google not to index is a contradictory signal and wastes crawl budget.
 *
 * @return array<int, array{loc:string, lastmod:?string, changefreq:string, priority:string}>
 */
function sitemapEntries(): array
{
    $entries = [];

    try {
        $pages = db()->query('
            SELECT path, sitemap_priority, sitemap_freq, updated_at
            FROM `page_seo`
            WHERE in_sitemap = 1 AND robots_noindex = 0
            ORDER BY sitemap_priority DESC, sort_order ASC
        ')->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('sitemap: page_seo query failed: ' . $e->getMessage());
        $pages = [];
    }

    foreach ($pages as $p) {
        $entries[] = [
            'loc'        => seo_url($p['path']),
            'lastmod'    => !empty($p['updated_at'])
                ? (new DateTime($p['updated_at']))->format('Y-m-d')
                : null,
            'changefreq' => $p['sitemap_freq'],
            'priority'   => number_format((float) $p['sitemap_priority'], 1),
        ];
    }

    try {
        $blogs = db()->query('
            SELECT slug, updated_at, created_at
            FROM `blogs`
            WHERE is_published = 1
            ORDER BY updated_at DESC
        ')->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('sitemap: blogs query failed: ' . $e->getMessage());
        $blogs = [];
    }

    foreach ($blogs as $b) {
        $stamp = $b['updated_at'] ?: $b['created_at'];
        $entries[] = [
            'loc'        => seo_url('/blogs/' . rawurlencode($b['slug']) . '/'),
            'lastmod'    => $stamp ? (new DateTime($stamp))->format('Y-m-d') : null,
            'changefreq' => 'weekly',
            'priority'   => '0.7',
        ];
    }

    return $entries;
}

/** Render the entries as sitemap XML. */
function sitemapXml(?array $entries = null): string
{
    $entries ??= sitemapEntries();

    $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($entries as $e) {
        $xml .= "    <url>\n";
        $xml .= '        <loc>' . seo_e($e['loc']) . "</loc>\n";
        if (!empty($e['lastmod'])) {
            $xml .= '        <lastmod>' . seo_e($e['lastmod']) . "</lastmod>\n";
        }
        $xml .= '        <changefreq>' . seo_e($e['changefreq']) . "</changefreq>\n";
        $xml .= '        <priority>' . seo_e($e['priority']) . "</priority>\n";
        $xml .= "    </url>\n";
    }

    return $xml . '</urlset>';
}
