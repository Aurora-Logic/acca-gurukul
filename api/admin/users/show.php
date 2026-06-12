<?php
/**
 * GET /api/admin/users/show.php?id=123
 * Returns a single admin (no password hash). Auth required.
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
    jsonError('Invalid id', 422);
}

try {
    $stmt = db()->prepare('
        SELECT id, name, email, is_active, created_at, updated_at
        FROM `admins` WHERE id = :id LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();

    if (!$r) {
        jsonError('User not found', 404);
    }

    jsonSuccess('OK', [
        'user' => [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'email'      => $r['email'],
            'is_active'  => (bool) $r['is_active'],
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ],
    ]);

} catch (PDOException $e) {
    error_log('users/show error: ' . $e->getMessage());
    jsonError('Failed to load user', 500);
}
