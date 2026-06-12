<?php
/**
 * POST /api/admin/faqs/delete.php
 * Deletes a FAQ.
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

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id = (int)($input['id'] ?? 0);

if ($id <= 0) {
    jsonError('Valid ID is required', 400);
}

try {
    $stmt = db()->prepare('DELETE FROM `faqs` WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonError('FAQ not found', 404);
    }

    jsonSuccess('FAQ deleted successfully');

} catch (PDOException $e) {
    error_log('faqs/delete error: ' . $e->getMessage());
    jsonError('Failed to delete FAQ', 500);
}
