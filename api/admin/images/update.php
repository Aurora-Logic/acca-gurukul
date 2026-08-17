<?php
/**
 * POST /api/admin/images/update.php
 * Saves alt text for one or many images in a single transaction.
 *
 * Accepts { "images": [{ id, alt_text, is_decorative }, …] } so the admin can
 * edit a whole page's worth and save once, rather than firing a request per
 * field and leaving a half-applied set behind if one fails.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$data  = getJsonBody();
$items = $data['images'] ?? null;

if (!is_array($items) || $items === []) {
    jsonError('No images supplied', 422);
}
if (count($items) > 500) {
    jsonError('Too many images in one request', 422);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('
        UPDATE `image_alt`
        SET alt_text = :alt_text, is_decorative = :is_decorative
        WHERE id = :id
    ');

    $updated = 0;
    foreach ($items as $item) {
        $id = (int) ($item['id'] ?? 0);
        if ($id <= 0) {
            continue;
        }

        $decorative = !empty($item['is_decorative']) ? 1 : 0;
        $alt        = trim((string) ($item['alt_text'] ?? ''));
        // A decorative image is meant to have no alt at all; keeping stale text
        // on the row would be confusing the next time someone unticks the box.
        $alt        = $decorative || $alt === '' ? null : mb_substr($alt, 0, 300);

        $stmt->execute([
            ':alt_text'      => $alt,
            ':is_decorative' => $decorative,
            ':id'            => $id,
        ]);
        $updated += $stmt->rowCount();
    }

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('images/update error: ' . $e->getMessage());
    jsonError('Failed to save alt text', 500);
}

jsonSuccess('Alt text saved', ['updated' => $updated]);
