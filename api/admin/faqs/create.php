<?php
/**
 * POST /api/admin/faqs/create.php
 * Creates a new FAQ.
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
$question = trim((string)($input['question'] ?? ''));
$answer = trim((string)($input['answer'] ?? ''));
$is_active = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;
$order_idx = isset($input['order_idx']) ? (int)$input['order_idx'] : 0;

if ($question === '' || $answer === '') {
    jsonError('Question and answer are required', 400);
}

try {
    $stmt = db()->prepare('
        INSERT INTO `faqs` (question, answer, is_active, order_idx)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([$question, $answer, $is_active, $order_idx]);
    $id = db()->lastInsertId();

    jsonSuccess('FAQ created successfully', [
        'faq' => [
            'id'         => (int) $id,
            'question'   => $question,
            'answer'     => $answer,
            'is_active'  => (bool) $is_active,
            'order_idx'  => $order_idx,
        ]
    ]);

} catch (PDOException $e) {
    error_log('faqs/create error: ' . $e->getMessage());
    jsonError('Failed to create FAQ', 500);
}
