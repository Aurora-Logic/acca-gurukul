<?php
/**
 * GET /api/blog.php?slug=my-post-name
 * Returns a single public blog post and records a unique view based on IP and User-Agent.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config/bootstrap.php';

$slug = sanitize((string)($_GET['slug'] ?? ''));

if (!$slug) {
    jsonError('Blog slug not provided', 422);
}

try {
    // 1. Fetch the published blog
    $stmt = db()->prepare('
        SELECT 
            id, title, slug, excerpt, content, featured_image,
            category, tags, meta_title, meta_description, author, read_time,
            views, created_at, updated_at
        FROM `blogs` 
        WHERE slug = :slug AND is_published = 1
        LIMIT 1
    ');
    $stmt->execute([':slug' => $slug]);
    $blog = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$blog) {
        jsonError('Blog post not found', 404);
    }

    $blogId = (int)$blog['id'];
    $ip = getClientIp();
    $userAgent = sanitize($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');

    // 2. Track unique view
    try {
        $viewStmt = db()->prepare('
            INSERT IGNORE INTO `blog_views` (blog_id, ip_address, user_agent, viewed_at)
            VALUES (:blog_id, :ip, :ua, NOW())
        ');
        $viewStmt->execute([
            ':blog_id' => $blogId,
            ':ip' => $ip,
            ':ua' => $userAgent
        ]);

        // If insert ignore was successful, it means it's a new unique view
        if ($viewStmt->rowCount() > 0) {
            $updateViews = db()->prepare('UPDATE `blogs` SET views = views + 1 WHERE id = :id');
            $updateViews->execute([':id' => $blogId]);
            $blog['views'] = (int)$blog['views'] + 1; // update our local output so it's fresh
        }
    } catch (PDOException $ve) {
        error_log('blog views tracking error: ' . $ve->getMessage());
        // Do not fail the request if view tracking fails
    }

    $blog['id'] = $blogId;
    $blog['read_time'] = (int)$blog['read_time'];
    $blog['views'] = (int)$blog['views'];

    // If tags are stored as a CSV string, no conversion needed here, frontend can split if needed.
    
    jsonSuccess('OK', ['blog' => $blog]);

} catch (PDOException $e) {
    error_log('blogs/show public error: ' . $e->getMessage());
    jsonError('Failed to load blog post', 500);
}
