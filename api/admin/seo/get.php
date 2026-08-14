<?php
/**
 * GET /api/admin/seo/get.php?page_key=home
 * Full SEO record for one page.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$pageKey = trim((string) ($_GET['page_key'] ?? ''));
if ($pageKey === '') {
    jsonError('page_key is required', 422);
}

try {
    $stmt = db()->prepare('SELECT * FROM `page_seo` WHERE page_key = :k LIMIT 1');
    $stmt->execute([':k' => $pageKey]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('seo/get error: ' . $e->getMessage());
    jsonError('Failed to load page SEO', 500);
}

if (!$row) {
    jsonError('Page not found', 404);
}

jsonResponse([
    'error' => false,
    'page'  => [
        'id'               => (int) $row['id'],
        'page_key'         => $row['page_key'],
        'path'             => $row['path'],
        'label'            => $row['label'],
        'meta_title'       => $row['meta_title'] ?? '',
        'meta_description' => $row['meta_description'] ?? '',
        'meta_keywords'    => $row['meta_keywords'] ?? '',
        'canonical_url'    => $row['canonical_url'] ?? '',
        'og_title'         => $row['og_title'] ?? '',
        'og_description'   => $row['og_description'] ?? '',
        'og_image'         => $row['og_image'] ?? '',
        'og_type'          => $row['og_type'] ?? 'website',
        'twitter_card'     => $row['twitter_card'] ?? 'summary_large_image',
        'robots_noindex'   => (bool) $row['robots_noindex'],
        'robots_nofollow'  => (bool) $row['robots_nofollow'],
        'structured_data'  => $row['structured_data'] ?? '',
        'in_sitemap'       => (bool) $row['in_sitemap'],
        'sitemap_priority' => (float) $row['sitemap_priority'],
        'sitemap_freq'     => $row['sitemap_freq'],
        'updated_at'       => $row['updated_at'],
    ],
]);
