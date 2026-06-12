<?php
/**
 * GET /api/blogs.php
 * Returns all published blogs ordered by published_at DESC.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config/bootstrap.php';

try {
    $stmt = db()->query('
        SELECT
            id, title, slug, excerpt, featured_image, category,
            tags, author, read_time, is_featured, views, created_at, updated_at
        FROM `blogs`
        WHERE is_published = 1
        ORDER BY is_featured DESC, created_at DESC
    ');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $blogs = array_map(function ($r) {
        return [
            'id'               => (int) $r['id'],
            'title'            => $r['title'],
            'slug'             => $r['slug'],
            'excerpt'          => $r['excerpt'],
            'featured_image'   => $r['featured_image'],
            'category'         => $r['category'],
            'tags'             => $r['tags'],
            'author'           => $r['author'],
            'read_time'        => (int) $r['read_time'],
            'is_featured'      => (bool) $r['is_featured'],
            'views'            => (int) $r['views'],
            'created_at'       => $r['created_at'],
            'updated_at'       => $r['updated_at'],
        ];
    }, $rows);

    jsonSuccess('OK', [
        'blogs' => $blogs,
        'total' => count($blogs),
    ]);

} catch (PDOException $e) {
    error_log('blogs public list error: ' . $e->getMessage());
    jsonError('Failed to load blogs', 500);
}
