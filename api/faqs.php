<?php
/**
 * GET /api/faqs.php
 * Returns all active FAQs for the public website.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config/bootstrap.php';

try {
    $stmt = db()->query('
        SELECT
            id,
            question,
            answer
        FROM `faqs`
        WHERE is_active = 1
        ORDER BY order_idx ASC, created_at DESC
    ');
    $rows = $stmt->fetchAll();

    $faqs = array_map(function ($r) {
        return [
            'id'       => (int) $r['id'],
            'question' => $r['question'],
            'answer'   => $r['answer'],
        ];
    }, $rows);

    jsonSuccess('OK', [
        'faqs' => $faqs
    ]);

} catch (PDOException $e) {
    error_log('faqs public error: ' . $e->getMessage());
    jsonError('Failed to load FAQs', 500);
}
