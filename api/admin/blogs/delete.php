<?php
/**
 * POST /api/admin/blogs/delete.php
 * Body: { id }
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$data = getJsonBody();
$id   = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonError('Invalid ID', 422);
}

try {
    $stmt = db()->prepare('DELETE FROM `blogs` WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Blog post not found', 404);
    }

    jsonSuccess('Blog post deleted');
} catch (PDOException $e) {
    error_log('blogs/delete error: ' . $e->getMessage());
    jsonError('Failed to delete blog post', 500);
}
