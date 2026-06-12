<?php
/**
 * POST /api/admin/faqs/update.php
 * Updates an existing FAQ.
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
$question = trim((string)($input['question'] ?? ''));
$answer = trim((string)($input['answer'] ?? ''));
$is_active = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;
$order_idx = isset($input['order_idx']) ? (int)$input['order_idx'] : 0;

if ($id <= 0) {
    jsonError('Valid ID is required', 400);
}

if ($question === '' || $answer === '') {
    jsonError('Question and answer are required', 400);
}

try {
    $stmt = db()->prepare('
        UPDATE `faqs`
        SET question = ?, answer = ?, is_active = ?, order_idx = ?
        WHERE id = ?
    ');
    $stmt->execute([$question, $answer, $is_active, $order_idx, $id]);

    if ($stmt->rowCount() === 0) {
        $check = db()->prepare('SELECT id FROM `faqs` WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetchColumn()) {
            jsonError('FAQ not found', 404);
        }
    }

    jsonSuccess('FAQ updated successfully', [
        'faq' => [
            'id'         => $id,
            'question'   => $question,
            'answer'     => $answer,
            'is_active'  => (bool) $is_active,
            'order_idx'  => $order_idx,
        ]
    ]);

} catch (PDOException $e) {
    error_log('faqs/update error: ' . $e->getMessage());
    jsonError('Failed to update FAQ', 500);
}
