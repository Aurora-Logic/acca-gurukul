<?php
/**
 * GET/POST /api/admin/settings/tracking.php
 * Manage tracking tags & scripts (Google Tag, Meta Pixel, custom scripts).
 * Auth required for admin.
 */

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$pdo = db();

// Ensure site_settings table exists
$pdo->exec('
    CREATE TABLE IF NOT EXISTS `site_settings` (
        `id`                      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `google_tag_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
        `google_tag_id`           VARCHAR(100) NULL,
        `google_tag_script`       TEXT NULL,
        `meta_pixel_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
        `meta_pixel_id`           VARCHAR(100) NULL,
        `meta_pixel_script`       TEXT NULL,
        `custom_head_script`      TEXT NULL,
        `custom_body_script`      TEXT NULL,
        `updated_at`              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
');

// Ensure row 1 exists
$stmt = $pdo->query('SELECT COUNT(*) FROM `site_settings` WHERE `id` = 1');
if ((int)$stmt->fetchColumn() === 0) {
    $pdo->exec('INSERT INTO `site_settings` (`id`, `google_tag_enabled`, `meta_pixel_enabled`) VALUES (1, 0, 0)');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM `site_settings` WHERE `id` = 1 LIMIT 1');
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        jsonResponse([
            'error' => false,
            'settings' => [
                'google_tag_enabled' => (bool)($settings['google_tag_enabled'] ?? false),
                'google_tag_id'      => (string)($settings['google_tag_id'] ?? ''),
                'google_tag_script'  => (string)($settings['google_tag_script'] ?? ''),
                'meta_pixel_enabled' => (bool)($settings['meta_pixel_enabled'] ?? false),
                'meta_pixel_id'      => (string)($settings['meta_pixel_id'] ?? ''),
                'meta_pixel_script'  => (string)($settings['meta_pixel_script'] ?? ''),
                'custom_head_script' => (string)($settings['custom_head_script'] ?? ''),
                'custom_body_script' => (string)($settings['custom_body_script'] ?? ''),
                'updated_at'         => (string)($settings['updated_at'] ?? ''),
            ]
        ]);
    } catch (PDOException $e) {
        error_log('tracking GET error: ' . $e->getMessage());
        jsonError('Failed to retrieve tracking settings', 500);
    }
} elseif ($method === 'POST') {
    $body = getJsonBody();
    
    $googleTagEnabled = !empty($body['google_tag_enabled']) ? 1 : 0;
    $googleTagId = trim((string)($body['google_tag_id'] ?? ''));
    $googleTagScript = (string)($body['google_tag_script'] ?? '');
    
    $metaPixelEnabled = !empty($body['meta_pixel_enabled']) ? 1 : 0;
    $metaPixelId = trim((string)($body['meta_pixel_id'] ?? ''));
    $metaPixelScript = (string)($body['meta_pixel_script'] ?? '');
    
    $customHeadScript = (string)($body['custom_head_script'] ?? '');
    $customBodyScript = (string)($body['custom_body_script'] ?? '');

    try {
        $updateStmt = $pdo->prepare('
            UPDATE `site_settings` SET
                `google_tag_enabled` = :gte,
                `google_tag_id`      = :gtid,
                `google_tag_script`  = :gtscript,
                `meta_pixel_enabled` = :mpe,
                `meta_pixel_id`      = :mpid,
                `meta_pixel_script`  = :mpscript,
                `custom_head_script` = :chs,
                `custom_body_script` = :cbs
            WHERE `id` = 1
        ');
        
        $updateStmt->execute([
            ':gte'      => $googleTagEnabled,
            ':gtid'     => $googleTagId,
            ':gtscript' => $googleTagScript,
            ':mpe'      => $metaPixelEnabled,
            ':mpid'     => $metaPixelId,
            ':mpscript' => $metaPixelScript,
            ':chs'      => $customHeadScript,
            ':cbs'      => $customBodyScript,
        ]);

        jsonSuccess('Tracking settings saved successfully');
    } catch (PDOException $e) {
        error_log('tracking POST error: ' . $e->getMessage());
        jsonError('Failed to update tracking settings', 500);
    }
} else {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}
