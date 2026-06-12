<?php
/**
 * POST /api/admin/contacts/update.php
 * Toggle is_read status.
 * Body: { id: number, is_read: boolean }
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

$id     = (int)($data['id'] ?? 0);
$isRead = isset($data['is_read']) ? (int)(bool)$data['is_read'] : null;

if ($id <= 0) {
    jsonError('Invalid id', 422);
}
if ($isRead === null) {
    jsonError('Missing is_read', 422);
}

try {
    $stmt = db()->prepare('UPDATE `contacts` SET is_read = :ir WHERE id = :id');
    $stmt->execute([':ir' => $isRead, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Contact not found', 404);
    }

    jsonSuccess($isRead ? 'Marked as read' : 'Marked as unread', [
        'id'      => $id,
        'is_read' => (bool) $isRead,
    ]);

} catch (PDOException $e) {
    error_log('contacts/update error: ' . $e->getMessage());
    jsonError('Failed to update', 500);
}
