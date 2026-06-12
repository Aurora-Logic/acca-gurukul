<?php
/**
 * GET /api/admin/contacts/show.php?id=123
 * Returns a single contact enquiry by id. Auth required.
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
        SELECT id, name, phone, email, topic, message, is_read, ip_address, created_at, updated_at
        FROM `contacts`
        WHERE id = :id
        LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonError('Enquiry not found', 404);
    }

    jsonSuccess('OK', [
        'contact' => [
            'id'         => (int) $row['id'],
            'name'       => $row['name'],
            'phone'      => $row['phone'],
            'email'      => $row['email'],
            'topic'      => $row['topic'],
            'message'    => $row['message'],
            'is_read'    => (bool) $row['is_read'],
            'ip_address' => $row['ip_address'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ],
    ]);

} catch (PDOException $e) {
    error_log('contacts/show error: ' . $e->getMessage());
    jsonError('Failed to load enquiry', 500);
}
