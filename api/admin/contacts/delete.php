<?php
/**
 * POST /api/admin/contacts/delete.php
 * Body: { id: number }
 * Auth required.
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
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonError('Invalid id', 422);
}

try {
    $stmt = db()->prepare('DELETE FROM `contacts` WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Contact not found', 404);
    }

    jsonSuccess('Deleted', ['id' => $id]);

} catch (PDOException $e) {
    error_log('contacts/delete error: ' . $e->getMessage());
    jsonError('Failed to delete', 500);
}
