<?php
/**
 * GET /api/admin/blogs/show.php?id=xx
 * Returns a single blog post
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    jsonError('Invalid ID', 422);
}

try {
    $stmt = db()->prepare('
        SELECT * FROM `blogs` WHERE id = :id LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonError('Blog post not found', 404);
    }

    $row['id'] = (int)$row['id'];
    $row['is_published'] = (bool)$row['is_published'];
    $row['views'] = (int)$row['views'];
    $row['read_time'] = (int)$row['read_time'];
    
    // We assume tags is a string, and return it as is or decoding logic if we stored it as json
    
    jsonSuccess('OK', ['blog' => $row]);

} catch (PDOException $e) {
    error_log('blogs/show error: ' . $e->getMessage());
    jsonError('Failed to load blog post', 500);
}
