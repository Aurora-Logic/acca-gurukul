<?php
/**
 * POST /api/admin/users/delete.php
 * Body: { id }
 * Auth required.
 *
 * Rules:
 *  - You cannot delete your own account
 *  - Refuses to delete the last remaining admin (prevents total lockout)
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
$currentAdmin = requireAuth();

$data = getJsonBody();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonError('Invalid id', 422);
}

if ($id === (int) $currentAdmin['id']) {
    jsonError('You cannot delete your own account', 403);
}

try {
    // Safety: refuse to delete the last remaining admin
    $countStmt = db()->query('SELECT COUNT(*) FROM `admins`');
    $total = (int) $countStmt->fetchColumn();
    if ($total <= 1) {
        jsonError('Cannot delete the last remaining admin', 403);
    }

    $stmt = db()->prepare('DELETE FROM `admins` WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonError('User not found', 404);
    }

    jsonSuccess('Admin deleted', ['id' => $id]);

} catch (PDOException $e) {
    error_log('users/delete error: ' . $e->getMessage());
    jsonError('Failed to delete admin', 500);
}
