<?php
/**
 * GET /api/admin/blogs/list.php
 * Returns all blogs ordered by created_at DESC. Auth required.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

try {
    $stmt = db()->query('
        SELECT
            id, title, slug, excerpt, content, featured_image, category,
            tags, meta_title, meta_description, author, read_time, is_published, is_featured,
            views, created_at, updated_at
        FROM `blogs`
        ORDER BY created_at DESC
    ');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $blogs = array_map(function ($r) {
        return [
            'id'               => (int) $r['id'],
            'title'            => $r['title'],
            'slug'             => $r['slug'],
            'excerpt'          => $r['excerpt'],
            'content'          => $r['content'],
            'featured_image'   => $r['featured_image'],
            'category'         => $r['category'],
            'tags'             => $r['tags'], // Keep as string for simplicity or json decode
            'meta_title'       => $r['meta_title'],
            'meta_description' => $r['meta_description'],
            'author'           => $r['author'],
            'read_time'        => (int) $r['read_time'],
            'is_published'     => (bool) $r['is_published'],
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
    error_log('blogs/list error: ' . $e->getMessage());
    jsonError('Failed to load blogs', 500);
}
