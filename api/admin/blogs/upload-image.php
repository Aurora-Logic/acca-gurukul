<?php
/**
 * POST /api/admin/blogs/upload-image.php
 * Handles image upload from the editor
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/uploads.php';
requireAuth();

if (!isset($_FILES['image'])) {
    jsonError('No image uploaded', 422);
}

try {
    $url = storeUploadedImage(
        $_FILES['image'],
        __DIR__ . '/../../../uploads/blogs',
        '/uploads/blogs',
        'inline'
    );
} catch (RuntimeException $e) {
    jsonError($e->getMessage(), 422);
}

jsonSuccess('Image uploaded successfully', ['url' => $url]);
