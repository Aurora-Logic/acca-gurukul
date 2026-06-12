<?php
/**
 * POST /api/admin/bookings/update.php
 * Body: { id: number, status: 'new'|'confirmed'|'cancelled'|'completed' }
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
$status = (string)($data['status'] ?? '');

if ($id <= 0) {
    jsonError('Invalid id', 422);
}

$allowedStatuses = ['new', 'confirmed', 'cancelled', 'completed'];
if (!in_array($status, $allowedStatuses, true)) {
    jsonError('Invalid status', 422);
}

try {
    $stmt = db()->prepare('UPDATE `bookings` SET status = :st WHERE id = :id');
    $stmt->execute([':st' => $status, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        // rowCount is 0 either when id doesn't exist OR status was already set to same value.
        // Distinguish by checking existence:
        $chk = db()->prepare('SELECT 1 FROM `bookings` WHERE id = :id');
        $chk->execute([':id' => $id]);
        if (!$chk->fetchColumn()) {
            jsonError('Booking not found', 404);
        }
    }

    jsonSuccess('Status updated', [
        'id'     => $id,
        'status' => $status,
    ]);

} catch (PDOException $e) {
    error_log('bookings/update error: ' . $e->getMessage());
    jsonError('Failed to update', 500);
}
