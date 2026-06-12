<?php
/**
 * GET /api/admin/users/list.php
 * Returns all admins (without password hashes). Auth required.
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
        SELECT id, name, email, is_active, created_at, updated_at
        FROM `admins`
        ORDER BY created_at DESC
    ');
    $rows = $stmt->fetchAll();

    $users = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'email'      => $r['email'],
            'is_active'  => (bool) $r['is_active'],
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ];
    }, $rows);

    jsonSuccess('OK', [
        'users' => $users,
        'total' => count($users),
    ]);

} catch (PDOException $e) {
    error_log('users/list error: ' . $e->getMessage());
    jsonError('Failed to load users', 500);
}
