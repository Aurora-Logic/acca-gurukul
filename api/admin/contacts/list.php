<?php
/**
 * GET /api/admin/contacts/list.php
 * Returns all contact submissions, newest first.
 * Auth required.
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
        SELECT
            id,
            name,
            phone,
            email,
            topic,
            message,
            is_read,
            created_at,
            updated_at
        FROM `contacts`
        ORDER BY created_at DESC
    ');
    $rows = $stmt->fetchAll();

    // Normalise types for JSON (booleans, numbers)
    $contacts = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'phone'      => $r['phone'],
            'email'      => $r['email'],
            'topic'      => $r['topic'],
            'message'    => $r['message'],
            'is_read'    => (bool) $r['is_read'],
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ];
    }, $rows);

    jsonSuccess('OK', [
        'contacts' => $contacts,
        'total'    => count($contacts),
        'unread'   => count(array_filter($contacts, fn($c) => !$c['is_read'])),
    ]);

} catch (PDOException $e) {
    error_log('contacts/list error: ' . $e->getMessage());
    jsonError('Failed to load contacts', 500);
}
