<?php
/**
 * GET /api/public_tracking.php
 * Returns active tracking configuration for public site tag execution.
 * Public endpoint (no auth required).
 */

require_once __DIR__ . '/config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

try {
    $pdo = db();
    
    // Check if table exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'site_settings'")->rowCount() > 0;
    
    if (!$tableExists) {
        jsonResponse([
            'google_tag_enabled' => false,
            'meta_pixel_enabled' => false,
        ]);
    }
    
    $stmt = $pdo->query('SELECT * FROM `site_settings` WHERE `id` = 1 LIMIT 1');
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        jsonResponse([
            'google_tag_enabled' => false,
            'meta_pixel_enabled' => false,
        ]);
    }

    jsonResponse([
        'google_tag_enabled' => (bool)$settings['google_tag_enabled'],
        'google_tag_id'      => (string)($settings['google_tag_id'] ?? ''),
        'google_tag_script'  => (string)($settings['google_tag_script'] ?? ''),
        'meta_pixel_enabled' => (bool)$settings['meta_pixel_enabled'],
        'meta_pixel_id'      => (string)($settings['meta_pixel_id'] ?? ''),
        'meta_pixel_script'  => (string)($settings['meta_pixel_script'] ?? ''),
        'custom_head_script' => (string)($settings['custom_head_script'] ?? ''),
        'custom_body_script' => (string)($settings['custom_body_script'] ?? ''),
    ]);
} catch (PDOException $e) {
    error_log('public_tracking GET error: ' . $e->getMessage());
    jsonResponse([
        'google_tag_enabled' => false,
        'meta_pixel_enabled' => false,
    ]);
}
