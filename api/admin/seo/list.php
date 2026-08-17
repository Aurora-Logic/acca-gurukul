<?php
/**
 * GET /api/admin/seo/list.php
 * Every managed page plus a completeness score, for the SEO overview table.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

try {
    $rows = db()->query('
        SELECT id, page_key, path, label, meta_title, meta_description, og_image,
               robots_noindex, robots_nofollow, structured_data,
               in_sitemap, sitemap_priority, sitemap_freq, updated_at
        FROM `page_seo`
        ORDER BY sort_order ASC, id ASC
    ')->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('seo/list error: ' . $e->getMessage());
    jsonError('Failed to load SEO pages', 500);
}

// A page with no og_image still gets a social card from the sitewide default,
// so only flag a missing image when there is no fallback either.
try {
    $defaultOgImage = (string) db()->query(
        'SELECT default_og_image FROM `seo_settings` WHERE id = 1 LIMIT 1'
    )->fetchColumn();
} catch (PDOException $e) {
    $defaultOgImage = '';
}

/**
 * Scored against what actually moves rankings, so the admin can see at a glance
 * which pages are still weak rather than just "has a title".
 */
function seoIssues(array $r, string $defaultOgImage): array
{
    $issues = [];
    $title  = (string) ($r['meta_title'] ?? '');
    $desc   = (string) ($r['meta_description'] ?? '');
    $len    = fn(string $v) => mb_strlen($v);

    if ($title === '')                        $issues[] = 'Missing title';
    elseif ($len($title) < 30)                $issues[] = 'Title too short (under 30 chars)';
    elseif ($len($title) > 60)                $issues[] = 'Title too long (over 60 chars)';

    if ($desc === '')                         $issues[] = 'Missing meta description';
    elseif ($len($desc) < 70)                 $issues[] = 'Description too short (under 70 chars)';
    elseif ($len($desc) > 160)                $issues[] = 'Description too long (over 160 chars)';

    if (empty($r['og_image']) && $defaultOgImage === '') {
        $issues[] = 'No social share image';
    }
    if (!empty($r['robots_noindex']))         $issues[] = 'Excluded from search (noindex)';
    if (empty($r['in_sitemap']))              $issues[] = 'Excluded from sitemap';

    return $issues;
}

$pages = array_map(function (array $r) use ($defaultOgImage) {
    $issues = seoIssues($r, $defaultOgImage);
    return [
        'id'               => (int) $r['id'],
        'page_key'         => $r['page_key'],
        'path'             => $r['path'],
        'label'            => $r['label'],
        'meta_title'       => $r['meta_title'],
        'meta_description' => $r['meta_description'],
        'og_image'         => $r['og_image'],
        'title_length'     => mb_strlen((string) $r['meta_title']),
        'desc_length'      => mb_strlen((string) $r['meta_description']),
        'robots_noindex'   => (bool) $r['robots_noindex'],
        'robots_nofollow'  => (bool) $r['robots_nofollow'],
        'has_schema'       => !empty($r['structured_data']),
        'in_sitemap'       => (bool) $r['in_sitemap'],
        'sitemap_priority' => (float) $r['sitemap_priority'],
        'sitemap_freq'     => $r['sitemap_freq'],
        'issues'           => $issues,
        'score'            => max(0, 100 - (count($issues) * 20)),
        'updated_at'       => $r['updated_at'],
    ];
}, $rows);

jsonResponse(['error' => false, 'pages' => $pages]);
