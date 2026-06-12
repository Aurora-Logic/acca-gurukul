<?php
/**
 * GET /api/admin/faqs/list.php
 * Returns all faqs.
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
            question,
            answer,
            is_active,
            order_idx,
            created_at,
            updated_at
        FROM `faqs`
        ORDER BY order_idx ASC, created_at DESC
    ');
    $rows = $stmt->fetchAll();

    $faqs = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'question'   => $r['question'],
            'answer'     => $r['answer'],
            'is_active'  => (bool) $r['is_active'],
            'order_idx'  => (int) $r['order_idx'],
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ];
    }, $rows);

    jsonSuccess('OK', [
        'faqs' => $faqs,
        'total' => count($faqs),
    ]);

} catch (PDOException $e) {
    error_log('faqs/list error: ' . $e->getMessage());
    jsonError('Failed to load FAQs', 500);
}
