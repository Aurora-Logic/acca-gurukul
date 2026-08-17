<?php
/**
 * GET  /api/admin/sitemap.php — preview the live sitemap
 * POST /api/admin/sitemap.php — ping search engines that it changed
 *
 * The sitemap is generated on request by /sitemap.php straight from the
 * database, so there is nothing to "regenerate". An earlier version of this
 * endpoint wrote a static sitemap.xml into the web root; because .htaccess only
 * rewrites /sitemap.xml when no real file exists, that stale copy would have
 * silently shadowed the live one from then on. It also kept its own hardcoded
 * page list, which had already drifted from the actual site.
 */

require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../../components/sitemap.php';
require_once __DIR__ . '/../../components/indexnow.php';
requireAuth();

/** @return array{urls: array, static_count: int, blog_count: int} */
function sitemapPreview(): array
{
    $urls        = [];
    $staticCount = 0;
    $blogCount   = 0;

    try {
        $pages = db()->query('
            SELECT page_key, label, path, sitemap_priority, sitemap_freq, updated_at,
                   in_sitemap, robots_noindex
            FROM `page_seo`
            ORDER BY sort_order ASC
        ')->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('admin/sitemap pages error: ' . $e->getMessage());
        $pages = [];
    }

    foreach ($pages as $p) {
        $included = (int) $p['in_sitemap'] === 1 && (int) $p['robots_noindex'] === 0;
        if ($included) {
            $staticCount++;
        }
        $urls[] = [
            'type'       => 'Static Page',
            'name'       => $p['label'],
            'key'        => $p['page_key'],
            'url'        => seo_url($p['path']),
            'loc'        => $p['path'],
            'priority'   => number_format((float) $p['sitemap_priority'], 1),
            'changefreq' => $p['sitemap_freq'],
            'lastmod'    => !empty($p['updated_at'])
                ? (new DateTime($p['updated_at']))->format('Y-m-d')
                : null,
            'included'   => $included,
            'reason'     => $included
                ? null
                : ((int) $p['robots_noindex'] === 1 ? 'Set to noindex' : 'Excluded from sitemap'),
        ];
    }

    try {
        $blogs = db()->query('
            SELECT title, slug, updated_at, created_at, is_published
            FROM `blogs`
            ORDER BY updated_at DESC
        ')->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('admin/sitemap blogs error: ' . $e->getMessage());
        $blogs = [];
    }

    foreach ($blogs as $b) {
        $included = (int) $b['is_published'] === 1;
        if ($included) {
            $blogCount++;
        }
        $stamp = $b['updated_at'] ?: $b['created_at'];
        $urls[] = [
            'type'       => 'Blog Article',
            'name'       => $b['title'] ?: $b['slug'],
            'key'        => $b['slug'],
            'url'        => seo_url('/blogs/' . rawurlencode($b['slug']) . '/'),
            'loc'        => '/blogs/' . $b['slug'] . '/',
            'priority'   => '0.7',
            'changefreq' => 'weekly',
            'lastmod'    => $stamp ? (new DateTime($stamp))->format('Y-m-d') : null,
            'included'   => $included,
            'reason'     => $included ? null : 'Draft — not published',
        ];
    }

    return ['urls' => $urls, 'static_count' => $staticCount, 'blog_count' => $blogCount];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $preview    = sitemapPreview();
    $sitemapUrl = seo_url('/sitemap.xml');
    $feedUrl    = seo_url('/feed/');
    $key        = indexnow_get_key();

    // A leftover static file would take precedence over the dynamic route, so
    // surface it rather than letting it silently serve stale URLs.
    $staleFile = __DIR__ . '/../../sitemap.xml';

    jsonResponse([
        'error'   => false,
        'sitemap' => array_merge($preview, [
            'sitemap_url'    => $sitemapUrl,
            'robots_url'     => seo_url('/robots.txt'),
            'feed_url'       => $feedUrl,
            'indexnow_key'   => $key,
            'indexnow_url'   => seo_url('/' . $key . '.txt'),
            'total_urls'     => $preview['static_count'] + $preview['blog_count'],
            'is_dynamic'     => true,
            'stale_file'     => file_exists($staleFile),
            'xml_content'    => sitemapXml(),
            'last_generated' => 'Generated live on every request',
            'submit_google'  => 'https://search.google.com/search-console/sitemaps?resource_id='
                . rawurlencode(seo_settings()['site_url'] ?? ''),
        ]),
    ]);
}

if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

// Remove a stale static sitemap.xml if one was left behind by the old endpoint.
$staleFile = __DIR__ . '/../../sitemap.xml';
$removed   = false;
if (file_exists($staleFile)) {
    $removed = @unlink($staleFile);
}

// Automatically notify IndexNow search partners (Bing, Yandex, Seznam, Naver) of all published URLs
$indexNowResult = indexnow_submit_all_published_blogs();

jsonSuccess('Sitemap refreshed and submitted to IndexNow search partners', [
    'sitemap' => array_merge(sitemapPreview(), [
        'sitemap_url'    => seo_url('/sitemap.xml'),
        'robots_url'     => seo_url('/robots.txt'),
        'feed_url'       => seo_url('/feed/'),
        'xml_content'    => sitemapXml(),
        'last_generated' => 'Generated live on every request',
        'stale_removed'  => $removed,
        'indexing'       => $indexNowResult,
    ]),
]);
